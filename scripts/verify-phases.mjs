import assert from 'node:assert/strict'
import { generateAdvisory, getRecommendedTemplate } from '../src/lib/advisoryEngine.js'
import { advisoryReferences } from '../src/data/references.js'
import { getReferenceDirection } from '../src/lib/referenceIntelligence.js'
import { prepareAdvisoryForLayout } from '../src/lib/designIntelligence.js'
import { BRAND_PROFILES, getBrandProfile } from '../src/data/brands.js'
import { createEditorState, updateLayerState } from '../src/lib/editorState.js'
import { evaluateAdvisory } from '../src/lib/qualityChecker.js'
import { ADVISORY_RESPONSE_SCHEMA } from '../server/advisoryPrompt.js'

assert.equal(advisoryReferences.length, 25, 'Reference library should contain every approved advisory image.')
for (const reference of advisoryReferences) {
  assert.ok(reference.category && reference.visualFamily && reference.suggestedTemplate && reference.density && reference.illustrationPosition)
  assert.ok(Array.isArray(reference.keywords) && reference.keywords.length > 0)
}

const advisory = generateAdvisory({ topic: 'MFA Fatigue Attack', audience: 'All Employees', advisoryType: 'Internal Advisory' })
const direction = getReferenceDirection(advisory)
assert.ok(direction.references.length >= 3, 'Reference intelligence should rank approved examples.')
assert.ok(direction.visualFamily, 'Reference intelligence should return a visual family.')

const prepared = prepareAdvisoryForLayout(advisory, direction.template || getRecommendedTemplate(advisory.category))
assert.ok(['editorial', 'split', 'flow'].includes(prepared.template), 'Design intelligence should choose an approved template.')
assert.ok(prepared.ranking.length === 3, 'All approved layouts should be scored.')

assert.ok(BRAND_PROFILES.length >= 4, 'Multiple brand profiles should be available.')
const brand = getBrandProfile('innvikta')
const editor = createEditorState()
assert.equal(Object.keys(editor.layers).length, 7, 'Advanced editor should expose all production layers.')
assert.equal(editor.layers.header.locked, true, 'Brand header should be protected by default.')

const quality = evaluateAdvisory(prepared.advisory, prepared.template, brand, editor)
assert.equal(quality.geometry.issues.length, 0, `Default approved layout should not have geometry issues: ${quality.geometry.issues.map(i => i.label).join('; ')}`)
assert.ok(quality.brandAudit.bodyContrast >= 4.5, 'Default body contrast must pass accessibility target.')

const unsafeEditor = updateLayerState(editor, 'title', { x: -700 })
const unsafeQuality = evaluateAdvisory(prepared.advisory, prepared.template, brand, unsafeEditor)
assert.equal(unsafeQuality.canExport, false, 'Safe-zone violations must block export.')
assert.ok(unsafeQuality.geometry.issues.some(item => item.id.startsWith('safe-zone-')))

const badBrand = { ...brand, ink: '#FFFFFF', paper: '#FFFFFF' }
const badBrandQuality = evaluateAdvisory(prepared.advisory, prepared.template, badBrand, editor)
assert.equal(badBrandQuality.canExport, false, 'Insufficient body contrast must block export.')

assert.equal(ADVISORY_RESPONSE_SCHEMA.properties.sectionOnePoints.minItems, 4)
assert.equal(ADVISORY_RESPONSE_SCHEMA.properties.sectionOnePoints.maxItems, 4)
assert.equal(ADVISORY_RESPONSE_SCHEMA.properties.sectionTwoPoints.minItems, 4)
assert.equal(ADVISORY_RESPONSE_SCHEMA.properties.sectionTwoPoints.maxItems, 4)

console.log('All phase logic checks passed.')
