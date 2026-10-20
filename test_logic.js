/**
 * TripReady 기능 로직 테스트 스크립트 (Node.js)
 */
const assert = require('assert');

// 1. 카테고리 및 기본 데이터 검증
const CATEGORIES = {
  clothes: { id: 'clothes', name: '의류', icon: '👕' },
  toiletries: { id: 'toiletries', name: '세면도구', icon: '🧴' },
  electronics: { id: 'electronics', name: '전자기기', icon: '📱' },
  essentials: { id: 'essentials', name: '여행 필수품', icon: '🪪' },
  medicine: { id: 'medicine', name: '의약품', icon: '💊' },
  etc: { id: 'etc', name: '기타', icon: '🎒' }
};

const DEFAULT_ITEMS = [
  { id: 'c1', name: '티셔츠', category: 'clothes', completed: false },
  { id: 'c2', name: '바지', category: 'clothes', completed: false },
  { id: 'c3', name: '속옷', category: 'clothes', completed: false },
  { id: 'c4', name: '양말', category: 'clothes', completed: false },
  { id: 'c5', name: '잠옷', category: 'clothes', completed: false },

  { id: 't1', name: '칫솔', category: 'toiletries', completed: false },
  { id: 't2', name: '치약', category: 'toiletries', completed: false },
  { id: 't3', name: '샴푸', category: 'toiletries', completed: false },
  { id: 't4', name: '수건', category: 'toiletries', completed: false },

  { id: 'e1', name: '휴대폰', category: 'electronics', completed: false },
  { id: 'e2', name: '충전기', category: 'electronics', completed: false },
  { id: 'e3', name: '보조배터리', category: 'electronics', completed: false },
  { id: 'e4', name: '이어폰', category: 'electronics', completed: false },

  { id: 'es1', name: '신분증', category: 'essentials', completed: false },
  { id: 'es2', name: '지갑', category: 'essentials', completed: false },
  { id: 'es3', name: '카드', category: 'essentials', completed: false },
  { id: 'es4', name: '예약 정보', category: 'essentials', completed: false },

  { id: 'm1', name: '상비약', category: 'medicine', completed: false },
  { id: 'm2', name: '밴드', category: 'medicine', completed: false },

  { id: 'etc1', name: '우산', category: 'etc', completed: false },
  { id: 'etc2', name: '물티슈', category: 'etc', completed: false },
  { id: 'etc3', name: '에코백', category: 'etc', completed: false }
];

console.log('--- 1. 기본 데이터 무결성 검증 ---');
assert.strictEqual(DEFAULT_ITEMS.length, 22, '기본 아이템은 총 22개여야 합니다.');
assert.strictEqual(DEFAULT_ITEMS.filter(i => i.category === 'clothes').length, 5);
assert.strictEqual(DEFAULT_ITEMS.filter(i => i.category === 'toiletries').length, 4);
assert.strictEqual(DEFAULT_ITEMS.filter(i => i.category === 'electronics').length, 4);
assert.strictEqual(DEFAULT_ITEMS.filter(i => i.category === 'essentials').length, 4);
assert.strictEqual(DEFAULT_ITEMS.filter(i => i.category === 'medicine').length, 2);
assert.strictEqual(DEFAULT_ITEMS.filter(i => i.category === 'etc').length, 3);
console.log('✓ 카테고리별 기본 아이템 수량 검증 통과');

console.log('--- 2. 통계 계산 로직 검증 ---');
function calcStats(items) {
  const total = items.length;
  const completed = items.filter(i => i.completed).length;
  const remaining = total - completed;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, remaining, rate };
}

let testItems = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
let stats = calcStats(testItems);
assert.strictEqual(stats.total, 22);
assert.strictEqual(stats.completed, 0);
assert.strictEqual(stats.remaining, 22);
assert.strictEqual(stats.rate, 0);

// 체크박스 토글
testItems[0].completed = true;
testItems[1].completed = true;
stats = calcStats(testItems);
assert.strictEqual(stats.completed, 2);
assert.strictEqual(stats.remaining, 20);
assert.strictEqual(stats.rate, 9); // 2/22 = 9.09% -> 9%
console.log('✓ 통계 계산 및 체크 상태 검증 통과');

console.log('--- 3. 새 아이템 추가 및 유효성 검사 ---');
function addItem(items, name, category) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('이름이 비어있습니다');
  if (!CATEGORIES[category]) throw new Error('존재하지 않는 카테고리');
  const exists = items.some(i => i.category === category && i.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) throw new Error('중복 아이템');
  
  const newItem = {
    id: 'test_' + Date.now(),
    name: trimmed,
    category,
    completed: false
  };
  return [...items, newItem];
}

// 빈 값 방지 테스트
assert.throws(() => addItem(testItems, '   ', 'clothes'), /이름이 비어있습니다/);
// 중복 방지 테스트
assert.throws(() => addItem(testItems, '티셔츠', 'clothes'), /중복 아이템/);
// 정상 추가 테스트
testItems = addItem(testItems, '바람막이 점퍼', 'clothes');
assert.strictEqual(testItems.length, 23);
assert.strictEqual(testItems.find(i => i.name === '바람막이 점퍼').category, 'clothes');
console.log('✓ 유효성 검사 및 아이템 추가 검증 통과');

console.log('--- 4. 아이템 삭제 테스트 ---');
function deleteItem(items, id) {
  return items.filter(i => i.id !== id);
}

const addedItem = testItems.find(i => i.name === '바람막이 점퍼');
testItems = deleteItem(testItems, addedItem.id);
assert.strictEqual(testItems.length, 22);
assert.strictEqual(testItems.some(i => i.name === '바람막이 점퍼'), false);
console.log('✓ 아이템 삭제 검증 통과');

console.log('--- 5. 0개일 때 0으로 나누기 방지 검증 ---');
const emptyStats = calcStats([]);
assert.strictEqual(emptyStats.rate, 0);
assert.strictEqual(emptyStats.total, 0);
console.log('✓ 빈 배열 안전성 검증 통과');

console.log('\n==================================');
console.log('🎉 모든 핵심 로직 단위 테스트 100% 통과!');
console.log('==================================');
