import { afterEach, expect, it, vi } from 'vitest';
import { lockCartForCheckout, writeCart } from '../src/components/cart-store';

afterEach(() => vi.unstubAllGlobals());

it('blocks mutations during payment preparation and permits retry edits after failure', () => {
  const setItem=vi.fn();
  vi.stubGlobal('window',new EventTarget());
  vi.stubGlobal('localStorage',{setItem});
  const release=lockCartForCheckout();
  try {
    expect(()=>writeCart([{id:'vinchas',quantity:2}])).toThrow('prepararse el pago');
    expect(()=>lockCartForCheckout()).toThrow('Ya se está preparando');
    expect(setItem).not.toHaveBeenCalled();
  } finally { release(); }
  writeCart([{id:'vinchas',quantity:2}]);
  expect(setItem).toHaveBeenCalledWith('lumiere-cart-v1',JSON.stringify([{id:'vinchas',quantity:2}]));
});
