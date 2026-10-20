/**
 * TripReady - 여행 준비물 체크리스트 JavaScript
 * 
 * 기능:
 * 1. 6개 카테고리 기본 준비물 로드 및 LocalStorage 동기화
 * 2. 체크박스 토글 & 취소선 처리
 * 3. 새 준비물 추가 (카테고리 선택, 유효성 검사)
 * 4. 준비물 개별 삭제
 * 5. 통계 및 프로그레스 바 실시간 계산
 * 6. 전체 보기 & 카테고리별 보기 필터링
 * 7. 전체 초기화 (확인 모달)
 * 8. 사용자 피드백 토스트 알림
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. 상수 및 초기 데이터 정의
  // ==========================================
  const STORAGE_KEY = 'tripready_items_v1';

  const CATEGORIES = {
    clothes: { id: 'clothes', name: '의류', icon: '👕' },
    toiletries: { id: 'toiletries', name: '세면도구', icon: '🧴' },
    electronics: { id: 'electronics', name: '전자기기', icon: '📱' },
    essentials: { id: 'essentials', name: '여행 필수품', icon: '🪪' },
    medicine: { id: 'medicine', name: '의약품', icon: '💊' },
    etc: { id: 'etc', name: '기타', icon: '🎒' }
  };

  const DEFAULT_ITEMS = [
    // 의류 (5개)
    { id: 'c1', name: '티셔츠', category: 'clothes', completed: false },
    { id: 'c2', name: '바지', category: 'clothes', completed: false },
    { id: 'c3', name: '속옷', category: 'clothes', completed: false },
    { id: 'c4', name: '양말', category: 'clothes', completed: false },
    { id: 'c5', name: '잠옷', category: 'clothes', completed: false },

    // 세면도구 (4개)
    { id: 't1', name: '칫솔', category: 'toiletries', completed: false },
    { id: 't2', name: '치약', category: 'toiletries', completed: false },
    { id: 't3', name: '샴푸', category: 'toiletries', completed: false },
    { id: 't4', name: '수건', category: 'toiletries', completed: false },

    // 전자기기 (4개)
    { id: 'e1', name: '휴대폰', category: 'electronics', completed: false },
    { id: 'e2', name: '충전기', category: 'electronics', completed: false },
    { id: 'e3', name: '보조배터리', category: 'electronics', completed: false },
    { id: 'e4', name: '이어폰', category: 'electronics', completed: false },

    // 여행 필수품 (4개)
    { id: 'es1', name: '신분증', category: 'essentials', completed: false },
    { id: 'es2', name: '지갑', category: 'essentials', completed: false },
    { id: 'es3', name: '카드', category: 'essentials', completed: false },
    { id: 'es4', name: '예약 정보', category: 'essentials', completed: false },

    // 의약품 (2개)
    { id: 'm1', name: '상비약', category: 'medicine', completed: false },
    { id: 'm2', name: '밴드', category: 'medicine', completed: false },

    // 기타 (3개)
    { id: 'etc1', name: '우산', category: 'etc', completed: false },
    { id: 'etc2', name: '물티슈', category: 'etc', completed: false },
    { id: 'etc3', name: '에코백', category: 'etc', completed: false }
  ];

  // ==========================================
  // 2. 상태 관리
  // ==========================================
  let items = loadItems();
  let currentFilter = 'all';

  // ==========================================
  // 3. DOM 요소 참조
  // ==========================================
  const statTotalEl = document.getElementById('stat-total');
  const statCompletedEl = document.getElementById('stat-completed');
  const statRemainingEl = document.getElementById('stat-remaining');
  const statRateEl = document.getElementById('stat-rate');
  const progressFillEl = document.getElementById('progress-fill');
  const progressPercentageTextEl = document.getElementById('progress-percentage-text');
  const progressBadgeEl = document.getElementById('progress-badge');

  const addItemForm = document.getElementById('add-item-form');
  const itemCategoryInput = document.getElementById('item-category');
  const itemNameInput = document.getElementById('item-name');
  const formErrorEl = document.getElementById('form-error');

  const filterTabsContainer = document.getElementById('filter-tabs');
  const categoryGridEl = document.getElementById('category-grid');

  const resetAllBtn = document.getElementById('reset-all-btn');
  const resetModal = document.getElementById('reset-modal');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');
  const toastContainer = document.getElementById('toast-container');

  // ==========================================
  // 4. 로컬 스토리지 관리 함수
  // ==========================================
  function loadItems() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('LocalStorage 로드 에러:', e);
    }
    // 데이터가 없거나 에러 시 기본값 복사본 저장 후 반환
    const initialCopy = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
    saveItems(initialCopy);
    return initialCopy;
  }

  function saveItems(newItems) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error('LocalStorage 저장 에러:', e);
      showToast('데이터 저장 중 오류가 발생했습니다.', 'danger');
    }
  }

  // ==========================================
  // 5. 렌더링 함수
  // ==========================================
  function render() {
    renderStats();
    renderFilterBadges();
    renderCards();
  }

  /**
   * 대시보드 통계 및 프로그레스 바 갱신
   */
  function renderStats() {
    const totalCount = items.length;
    const completedCount = items.filter(item => item.completed).length;
    const remainingCount = totalCount - completedCount;
    const rate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    statTotalEl.textContent = totalCount;
    statCompletedEl.textContent = completedCount;
    statRemainingEl.textContent = remainingCount;
    statRateEl.textContent = `${rate}%`;

    progressFillEl.style.width = `${rate}%`;
    progressPercentageTextEl.textContent = `${rate}%`;

    if (totalCount === 0) {
      progressBadgeEl.textContent = '준비물 없음';
      progressBadgeEl.className = 'progress-status-badge';
      progressFillEl.classList.remove('all-done');
    } else if (rate === 100) {
      progressBadgeEl.textContent = '준비 완료! 🎉';
      progressBadgeEl.className = 'progress-status-badge complete';
      progressFillEl.classList.add('all-done');
    } else if (rate > 0) {
      progressBadgeEl.textContent = '준비 진행 중 ✈️';
      progressBadgeEl.className = 'progress-status-badge in-progress';
      progressFillEl.classList.remove('all-done');
    } else {
      progressBadgeEl.textContent = '준비 시작 전';
      progressBadgeEl.className = 'progress-status-badge';
      progressFillEl.classList.remove('all-done');
    }
  }

  /**
   * 탭 뱃지 카운트 갱신
   */
  function renderFilterBadges() {
    const badgeAll = document.getElementById('tab-badge-all');
    if (badgeAll) badgeAll.textContent = items.length;

    Object.keys(CATEGORIES).forEach(catId => {
      const badge = document.getElementById(`tab-badge-${catId}`);
      if (badge) {
        const catCount = items.filter(item => item.category === catId).length;
        badge.textContent = catCount;
      }
    });
  }

  /**
   * 카테고리 카드 렌더링
   */
  function renderCards() {
    categoryGridEl.innerHTML = '';

    const categoriesToShow = currentFilter === 'all' 
      ? Object.keys(CATEGORIES) 
      : [currentFilter];

    categoriesToShow.forEach(catId => {
      const category = CATEGORIES[catId];
      if (!category) return;

      const categoryItems = items.filter(item => item.category === catId);
      const totalInCat = categoryItems.length;
      const completedInCat = categoryItems.filter(item => item.completed).length;
      const isAllDone = totalInCat > 0 && completedInCat === totalInCat;

      const card = document.createElement('div');
      card.className = `category-card ${isAllDone ? 'all-completed' : ''}`;
      card.id = `card-${catId}`;

      // Card Header
      const header = document.createElement('div');
      header.className = 'card-header';
      header.innerHTML = `
        <div class="category-title-wrap">
          <div class="category-icon" aria-hidden="true">${category.icon}</div>
          <h2 class="category-name">${category.name}</h2>
        </div>
        <div class="card-header-actions">
          <span class="category-badge ${isAllDone ? 'done' : ''}">
            ${completedInCat}/${totalInCat} 완료
          </span>
          ${totalInCat > 0 ? `
            <button type="button" class="btn-card-toggle" data-cat="${catId}" title="${isAllDone ? '카테고리 전체 해제' : '카테고리 전체 체크'}">
              ${isAllDone ? '전체 해제' : '전체 완료'}
            </button>
          ` : ''}
        </div>
      `;

      // Items List
      const list = document.createElement('ul');
      list.className = 'items-list';

      if (categoryItems.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-card-state';
        emptyState.innerHTML = `
          <div class="empty-card-icon">📭</div>
          <p>등록된 준비물이 없습니다.</p>
        `;
        list.appendChild(emptyState);
      } else {
        categoryItems.forEach(item => {
          const li = document.createElement('li');
          li.className = `item-row ${item.completed ? 'completed' : ''}`;
          li.setAttribute('data-id', item.id);

          li.innerHTML = `
            <label class="item-label">
              <input 
                type="checkbox" 
                class="custom-checkbox" 
                ${item.completed ? 'checked' : ''} 
                data-id="${item.id}"
                aria-label="${item.name} 준비 완료 여부"
              >
              <span class="item-text">${escapeHtml(item.name)}</span>
            </label>
            <button 
              type="button" 
              class="btn-delete-item" 
              data-id="${item.id}" 
              title="${escapeHtml(item.name)} 삭제"
              aria-label="${escapeHtml(item.name)} 삭제"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          `;

          list.appendChild(li);
        });
      }

      card.appendChild(header);
      card.appendChild(list);
      categoryGridEl.appendChild(card);
    });
  }

  // ==========================================
  // 6. 이벤트 핸들러
  // ==========================================

  /**
   * 준비물 체크 상태 토글
   */
  function toggleItem(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    item.completed = !item.completed;
    saveItems(items);
    render();
  }

  /**
   * 카테고리 전체 체크 / 해제
   */
  function toggleCategoryAll(catId) {
    const categoryItems = items.filter(item => item.category === catId);
    if (categoryItems.length === 0) return;

    const allCompleted = categoryItems.every(item => item.completed);
    categoryItems.forEach(item => {
      item.completed = !allCompleted;
    });

    saveItems(items);
    render();
    showToast(
      allCompleted 
        ? `${CATEGORIES[catId].name} 전체 체크를 해제했습니다.` 
        : `${CATEGORIES[catId].name} 전체를 완료 처리했습니다.`,
      'success'
    );
  }

  /**
   * 준비물 삭제
   */
  function deleteItem(id) {
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    items = items.filter(i => i.id !== id);
    saveItems(items);
    render();
    showToast(`'${targetItem.name}' 항목이 삭제되었습니다.`);
  }

  /**
   * 새 준비물 추가
   */
  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const category = itemCategoryInput.value;

    // 유효성 검사: 빈 값 체크
    if (!name) {
      showFormError('준비물 이름을 입력해 주세요.');
      itemNameInput.focus();
      return;
    }

    if (!CATEGORIES[category]) {
      showFormError('올바른 카테고리를 선택해 주세요.');
      return;
    }

    // 중복 체크 (동일 카테고리 내 같은 이름)
    const exists = items.some(i => i.category === category && i.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      showFormError('해당 카테고리에 이미 같은 이름의 준비물이 있습니다.');
      itemNameInput.focus();
      return;
    }

    // 새 아이템 생성
    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name,
      category: category,
      completed: false
    };

    items.push(newItem);
    saveItems(items);

    // 폼 초기화
    itemNameInput.value = '';
    clearFormError();
    itemNameInput.focus();

    render();
    showToast(`'${name}' 준비물이 추가되었습니다.`, 'success');
  });

  // 입력 중 에러 메시지 해제
  itemNameInput.addEventListener('input', () => {
    if (formErrorEl.style.display !== 'none') {
      clearFormError();
    }
  });

  function showFormError(msg) {
    formErrorEl.textContent = msg;
    formErrorEl.style.display = 'block';
  }

  function clearFormError() {
    formErrorEl.textContent = '';
    formErrorEl.style.display = 'none';
  }

  /**
   * 그리드 내부 이벤트 위임 (체크박스 클릭, 삭제 버튼 클릭, 전체 토글)
   */
  categoryGridEl.addEventListener('click', (e) => {
    // 1. 개별 삭제 버튼
    const deleteBtn = e.target.closest('.btn-delete-item');
    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      deleteItem(id);
      return;
    }

    // 2. 카테고리 전체 토글 버튼
    const toggleCatBtn = e.target.closest('.btn-card-toggle');
    if (toggleCatBtn) {
      const catId = toggleCatBtn.getAttribute('data-cat');
      toggleCategoryAll(catId);
      return;
    }
  });

  categoryGridEl.addEventListener('change', (e) => {
    // 체크박스 체인지 이벤트
    if (e.target && e.target.classList.contains('custom-checkbox')) {
      const id = e.target.getAttribute('data-id');
      toggleItem(id);
    }
  });

  /**
   * 카테고리 필터 탭 클릭
   */
  filterTabsContainer.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.filter-tab');
    if (!tabBtn) return;

    const filter = tabBtn.getAttribute('data-filter');
    if (filter === currentFilter) return;

    currentFilter = filter;

    // 탭 UI 활성화 전환
    document.querySelectorAll('.filter-tab').forEach(tab => {
      const isActive = tab.getAttribute('data-filter') === currentFilter;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    renderCards();
  });

  /**
   * 전체 초기화 모달 처리
   */
  function openResetModal() {
    resetModal.classList.add('open');
    resetModal.setAttribute('aria-hidden', 'false');
    modalCancelBtn.focus();
  }

  function closeResetModal() {
    resetModal.classList.remove('open');
    resetModal.setAttribute('aria-hidden', 'true');
    resetAllBtn.focus();
  }

  resetAllBtn.addEventListener('click', openResetModal);
  modalCancelBtn.addEventListener('click', closeResetModal);

  // 모달 바깥 클릭 시 닫기
  resetModal.addEventListener('click', (e) => {
    if (e.target === resetModal) {
      closeResetModal();
    }
  });

  // ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resetModal.classList.contains('open')) {
      closeResetModal();
    }
  });

  // 초기화 확정 실행
  modalConfirmBtn.addEventListener('click', () => {
    items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
    saveItems(items);
    currentFilter = 'all';

    // 탭 활성화 상태를 'all'로 리셋
    document.querySelectorAll('.filter-tab').forEach(tab => {
      const isAll = tab.getAttribute('data-filter') === 'all';
      tab.classList.toggle('active', isAll);
      tab.setAttribute('aria-selected', isAll ? 'true' : 'false');
    });

    closeResetModal();
    render();
    showToast('기본 준비물 목록으로 초기화되었습니다.', 'success');
  });

  // ==========================================
  // 7. 토스트 알림 기능
  // ==========================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'danger' ? 'toast-danger' : type === 'success' ? 'toast-success' : ''}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'danger') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    }, 2500);
  }

  // ==========================================
  // 8. 유틸리티 함수
  // ==========================================
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================
  // 9. 초기 렌더링 실행
  // ==========================================
  render();
});
