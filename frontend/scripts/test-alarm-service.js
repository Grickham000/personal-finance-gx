/**
 * Verification test script for credit card payment alarm & business day logic.
 * Can be run via: node scripts/test-alarm-service.js
 */

function adjustToBusinessDay(inputDate) {
  const adjusted = new Date(inputDate.getTime());
  const day = adjusted.getDay();
  let wasAdjusted = false;
  let originalDayName = undefined;

  if (day === 6) {
    adjusted.setDate(adjusted.getDate() - 1);
    wasAdjusted = true;
    originalDayName = 'Saturday';
  } else if (day === 0) {
    adjusted.setDate(adjusted.getDate() - 2);
    wasAdjusted = true;
    originalDayName = 'Sunday';
  }

  return {
    date: adjusted,
    wasAdjusted,
    originalDayName,
    originalDate: new Date(inputDate.getTime()),
  };
}

function getNextAlarmDate(card, triggerType, hour, minute = 0, referenceNow = new Date()) {
  const cutDateDay = card?.cut_date || 1;
  const daysToPay = card?.days_to_pay || 0;

  for (let offset = 0; offset <= 12; offset++) {
    const targetMonthDate = new Date(
      referenceNow.getFullYear(),
      referenceNow.getMonth() + offset,
      1
    );
    const year = targetMonthDate.getFullYear();
    const month = targetMonthDate.getMonth();

    const lastDayOfCutoffMonth = new Date(year, month + 1, 0).getDate();
    const cutoffDay = Math.min(cutDateDay, lastDayOfCutoffMonth);
    const cutoffDate = new Date(year, month, cutoffDay, hour, minute, 0, 0);

    let rawTargetDate;
    if (triggerType === 'cutoff') {
      rawTargetDate = cutoffDate;
    } else {
      rawTargetDate = new Date(cutoffDate.getTime());
      rawTargetDate.setDate(rawTargetDate.getDate() + daysToPay);
      rawTargetDate.setHours(hour, minute, 0, 0);
    }

    const businessDayResult = adjustToBusinessDay(rawTargetDate);

    if (businessDayResult.date.getTime() > referenceNow.getTime()) {
      return businessDayResult;
    }
  }

  const fallback = new Date(referenceNow.getTime() + 86400000);
  fallback.setHours(hour, minute, 0, 0);
  return adjustToBusinessDay(fallback);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('--- Running Alarm & Business Day Verification Tests ---');

// Test 1: Saturday adjustment -> Friday
const satDate = new Date(2026, 9, 17, 9, 0); // Oct 17, 2026 is Saturday
const resSat = adjustToBusinessDay(satDate);
assert(resSat.wasAdjusted === true, 'Saturday must be marked as adjusted');
assert(resSat.date.getDay() === 5, 'Saturday must adjust to Friday (day 5)');
assert(resSat.date.getDate() === 16, 'Oct 17 (Sat) must adjust to Oct 16 (Fri)');

// Test 2: Sunday adjustment -> Friday
const sunDate = new Date(2026, 9, 18, 9, 0); // Oct 18, 2026 is Sunday
const resSun = adjustToBusinessDay(sunDate);
assert(resSun.wasAdjusted === true, 'Sunday must be marked as adjusted');
assert(resSun.date.getDay() === 5, 'Sunday must adjust to Friday (day 5)');
assert(resSun.date.getDate() === 16, 'Oct 18 (Sun) must adjust to Oct 16 (Fri)');

// Test 3: Weekdays remain unchanged
[1, 2, 3, 4, 5].forEach((expectedDay) => {
  // Oct 12 (Mon) to Oct 16 (Fri)
  const weekday = new Date(2026, 9, 11 + expectedDay, 9, 0);
  const resWeek = adjustToBusinessDay(weekday);
  assert(resWeek.wasAdjusted === false, `Weekday (day ${expectedDay}) must not be adjusted`);
  assert(resWeek.date.getDay() === expectedDay, `Weekday must remain day ${expectedDay}`);
});

// Test 4: Month boundary rollback (Aug 1, 2027 is Sunday -> rolls back to July 30, 2027 Friday)
const sunMonthBoundary = new Date(2027, 7, 1, 9, 0);
const resBoundary = adjustToBusinessDay(sunMonthBoundary);
assert(resBoundary.wasAdjusted === true, 'Sunday on 1st of month must be adjusted');
assert(resBoundary.date.getMonth() === 6, 'Adjusted date must roll back to July (month index 6)');
assert(resBoundary.date.getDate() === 30, 'Adjusted date must be July 30th');
assert(resBoundary.date.getDay() === 5, 'Adjusted date must be Friday');

// Test 5: Next alarm date with Cutoff trigger
const cardA = { cut_date: 15, days_to_pay: 20 };
const refA = new Date(2026, 8, 1, 0, 0); // Sep 1, 2026
const nextCutoff = getNextAlarmDate(cardA, 'cutoff', 9, 0, refA);
assert(nextCutoff.date.getDate() === 15, 'Cutoff date must be day 15');
assert(nextCutoff.date.getMonth() === 8, 'Cutoff date must be September (8)');
assert(nextCutoff.date.getHours() === 9, 'Hour must be 9 AM');

// Test 6: Next alarm date with Due Date trigger landing on weekend
// Oct 15, 2026 + 23 days = Nov 7, 2026 (Saturday) -> Should be adjusted to Nov 6, 2026 (Friday)
const cardB = { cut_date: 15, days_to_pay: 23 };
const refB = new Date(2026, 9, 1, 0, 0); // Oct 1, 2026
const nextDue = getNextAlarmDate(cardB, 'due_date', 9, 0, refB);
assert(nextDue.wasAdjusted === true, 'Due date falling on weekend must be adjusted');
assert(nextDue.date.getDay() === 5, 'Due date adjusted must be Friday');
assert(nextDue.originalDate.getDay() === 6, 'Original date was Saturday');
assert(nextDue.date.getDate() === 6, 'Date adjusted must be Nov 6');

console.log('--- All Tests Passed Successfully! ---');
