import {it,expect} from 'vitest';
import {jsonLd,productSchema,businessSchema} from '../src/lib/seo';
it('escapes script closing tags without altering structured data values',()=>{
  const payload={name:'</script><script>alert(1)</script>'};const serialized=jsonLd(payload);
  expect(serialized).not.toContain('<');expect(JSON.parse(serialized)).toEqual(payload);
});
it('does not invent local address, business hours or product stock',()=>{
  expect(businessSchema(null)).not.toHaveProperty('address');
  expect(businessSchema(null)).not.toHaveProperty('openingHours');
  const schema=productSchema('https://studio.example.test');
  expect(schema.itemListElement[0].item.offers.price).toBe(38000);
  expect(schema.itemListElement[0].item.offers).not.toHaveProperty('availability');
});
