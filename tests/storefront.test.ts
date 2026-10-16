import { describe, expect, it } from 'vitest';
import { cartSuggestions, carouselPagination, changeCartQuantity, cartFingerprint } from '../src/domain/storefront';
import { quoteCart } from '../src/domain/commerce';

describe('storefront cart', () => {
  it('updates quantities and totals without changing other lines', () => {
    const lines = [{ id: 'vinchas', quantity: 1 }, { id: 'home-spray', quantity: 1 }];
    const updated = changeCartQuantity(lines, 'vinchas', 2);
    expect(updated).toEqual([{ id: 'vinchas', quantity: 2 }, { id: 'home-spray', quantity: 1 }]);
    expect(lines[0].quantity).toBe(1);
    expect(quoteCart(updated).total).toBe(2900000);
  });
  it('removes products and handles an empty cart', () => {
    expect(changeCartQuantity([{ id: 'vinchas', quantity: 1 }], 'vinchas', 0)).toEqual([]);
  });
  it.each([-1,21,1.5,NaN])('rejects invalid quantity %s', quantity => {
    expect(() => changeCartQuantity([{ id: 'vinchas', quantity: 1 }], 'vinchas', quantity)).toThrow();
  });
  it('suggests real products outside the current cart', () => {
    expect(cartSuggestions([{ id: 'limpiador-balsamo', quantity: 1 }]).some(product => product.id === 'limpiador-balsamo')).toBe(false);
    expect(cartSuggestions([])).toHaveLength(4);
  });
});

describe('product carousel pagination', () => {
  it('uses two pages for eight products shown four at a time', () => {
    expect(carouselPagination(1120,262,24,8,0,2264)).toEqual({page:0,pages:2,perPage:4,atStart:true,atEnd:false});
    expect(carouselPagination(1120,262,24,8,1144,2264).page).toBe(1);
  });
  it('keeps every product reachable on mobile with a partial next card', () => {
    expect(carouselPagination(350,290,16,8,0,2432)).toEqual({page:0,pages:8,perPage:1,atStart:true,atEnd:false});
    expect(carouselPagination(350,290,16,8,2082,2432).page).toBe(7);
  });
  it('keeps both arrows available between the actual scroll edges', () => {
    const partial = carouselPagination(1120,262,24,8,600,2264);
    expect(partial.atStart).toBe(false);
    expect(partial.atEnd).toBe(false);
  });
});

describe('checkout cart identity', () => {
  it('changes when quantities change outside the checkout view', () => {
    expect(cartFingerprint([{id:'vinchas',quantity:1}])).not.toBe(cartFingerprint([{id:'vinchas',quantity:2}]));
  });
  it('keeps the same identity when lines are reordered', () => {
    const lines=[{id:'vinchas',quantity:1},{id:'home-spray',quantity:2}];
    expect(cartFingerprint(lines)).toBe(cartFingerprint([...lines].reverse()));
  });
});
