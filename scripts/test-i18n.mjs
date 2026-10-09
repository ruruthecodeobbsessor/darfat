import assert from 'node:assert/strict';
import test from 'node:test';
import { messages } from '../lib/i18n/messages.js';
import { LANGUAGES, localeDirection, resolveLocale, stripLocale } from '../lib/i18n/config.js';
import { createI18n, translate } from '../lib/i18n/translate.js';
import { ONBOARDING_FIELDS, questionFor, scriptedTurn } from '../lib/onboarding.js';

test('locale values are allowlisted and public paths are preserved', () => {
  assert.equal(resolveLocale('untrusted'), 'ckb');
  assert.equal(localeDirection('ar'), 'rtl');
  assert.equal(localeDirection('en'), 'ltr');
  assert.equal(stripLocale('/ar/admin/opportunities'), '/admin/opportunities');
  assert.equal(stripLocale('/en'), '/');
  assert.equal(stripLocale('/english/profile'), '/english/profile');
});

test('translations preserve whitespace, interpolation values and unknown content', () => {
  assert.equal(translate(' زمان ', 'en'), ' Language ');
  assert.equal(translate('زمان', 'ar'), 'اللغة');
  assert.equal(translate('فۆڵۆکردنی {value0}', 'en', { value0: 'سەرەکی' }), 'Follow سەرەکی');
  assert.equal(translate('Uncatalogued user content', 'ar'), 'Uncatalogued user content');
  const element = { type: 'div' };
  assert.equal(translate(element, 'ar'), element);
});

test('every catalog entry has real UTF-8 translations and matching placeholders', () => {
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const [key, entry] of Object.entries(messages)) {
    assert.ok(!/\?\?/.test(key), key);
    for (const locale of ['ar', 'en']) {
      assert.ok(entry[locale]?.trim(), `${key}: ${locale}`);
      assert.ok(!/\?\?/.test(entry[locale]), `${key}: encoding`);
      assert.deepEqual(placeholders(entry[locale]), placeholders(key), `${key}: ${locale}`);
    }
  }
});

test('dates and numbers use the selected language', () => {
  assert.equal(createI18n('en').formatNumber(1234), '1,234');
  assert.equal(createI18n('ar').formatNumber(1234), '١٬٢٣٤');
  const date = '2026-11-15T12:00:00Z';
  assert.match(createI18n('en').formatDate(date), /Nov/);
  assert.match(createI18n('ar').formatDate(date), /٢٠٢٦/);
  assert.equal(createI18n('ar').formatDate('invalid'), '');
});

test('scripted onboarding questions follow the language without changing answers', () => {
  const answers = ['اسم الشخص', 'هەولێر', '٢٢', 'Technology', 'Python', 'My original bio'];
  for (const { code } of LANGUAGES) {
    for (let step = 0; step < ONBOARDING_FIELDS.length; step++) {
      const turn = scriptedTurn(answers.slice(0, step).map(text => ({ role: 'user', text })), 'Original Name', code);
      assert.ok(turn.reply.includes(questionFor(ONBOARDING_FIELDS[step], code)));
    }
    const result = scriptedTurn(answers.map(text => ({ role: 'user', text })), null, code);
    assert.equal(result.done, true);
    assert.equal(result.profile.name, answers[0]);
    assert.equal(result.profile.bio, answers[5]);
  }
  assert.ok(scriptedTurn([], null, 'ar').reply.includes('ما اسمك الكامل؟'));
  assert.ok(scriptedTurn([], null, 'en').reply.includes('what is your full name?'));
});
