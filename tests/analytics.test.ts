import { it, expect, vi, afterEach } from 'vitest';
import { track } from '../src/lib/analytics';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('never queues events before consent and reports whether the event was queued',()=>{
  const browser:{dataLayer?:Record<string,unknown>[]}={};let consent='denied';
  vi.stubGlobal('window',browser);vi.stubGlobal('localStorage',{getItem:()=>consent});
  expect(track({event:'view_item',event_id:'test-event'})).toBe(false);
  expect(browser.dataLayer).toBeUndefined();
  consent='granted';
  expect(track({event:'schedule_appointment',event_id:'appointment-id'})).toBe(true);
  expect(browser.dataLayer).toEqual([{event:'schedule_appointment',event_id:'appointment-id'}]);
});
it('does not let blocked browser storage interrupt the purchase flow',()=>{
  vi.stubGlobal('window',{});vi.stubGlobal('localStorage',{getItem:()=>{throw new Error('blocked');}});
  expect(track({event:'purchase',event_id:'order-id'})).toBe(false);
});
