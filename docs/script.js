(function() {
	// ==================== 主题管理（跟随系统） ====================
	function initTheme() {
		const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
	}

	// 监听系统颜色方案变化
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
		document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
	});

	// ==================== 图片加载错误处理 ====================
	function handleImageError(img) {
		img.src = '';
		img.classList.add('skeleton');
		img.style.display = 'block';
		img.style.width = img.getAttribute('data-width') || '60px';
		img.style.height = img.getAttribute('data-height') || '60px';
	}

	// 为图片添加错误处理
	function setupImageErrorHandling(img) {
		img.addEventListener('error', function() {
			handleImageError(this);
		});
		img.addEventListener('load', function() {
			this.classList.remove('skeleton');
		});
	}

	// 通用图片加载函数（带骨架图）
	function loadImageWithSkeleton(imgElement, src) {
		if (!src) return;
		
		const tempImg = new Image();
		tempImg.onload = function() {
			imgElement.classList.remove('skeleton');
			imgElement.src = src;
		};
		tempImg.onerror = function() {
			// 加载失败，保持骨架图
		};
		tempImg.src = src;
	}

	// ==================== 植物名称与图片映射 ====================
	const PLANT_NAMES = {
		'A': '向日葵',
		'B': '豌豆',
		'C': '卷心菜',
		'D': '坚果',
		'E': '地刺'
	};

	// 二阶植物实际名称
	const SECOND_ORDER_NAMES = {
		'AA': '双胞向日葵',
		'AB': '太阳能豌豆',
		'AD': '葵花籽',
		'BB': '双重射手',
		'BC': '迫击炮投手',
		'BD': '花生射手',
		'BE': '松针射手',
		'CC': '卷心菜连投手',
		'CD': '栗子投手',
		'DD': '高坚果',
		'DE': '荔枝',
		'EE': '锯齿草'
	};

	// 一阶植物图片
	const FIRST_ORDER_IMAGES = {
		'A': 'images/A-Sunflower.png',
		'B': 'images/B-Peashooter.png',
		'C': 'images/C-Cabbage-pult.png',
		'D': 'images/D-Wall-nut.png',
		'E': 'images/E-Spikeweed.png'
	};

	// 二阶植物图片映射（根据素材情况）
	const SECOND_ORDER_IMAGES = {
		'AA': 'images/AA-Sun Tower.png',
		'AB': 'images/AB-Solar Pea.png',
		'AD': 'images/AD-Sunflower Seed.png',
		'BB': 'images/BB-Gatling Pea.png',
		'BC': 'images/BC-Sling Pea.png',
		'BD': 'images/BD-Peanut.png',
		'BE': 'images/BE-Pine Needler.png',
		'CC': 'images/CC-Slaw Slinger.png',
		'CD': 'images/CD-Chuck-nut.png',
		'DD': 'images/DD-Tall-nut.png',
		'DE': 'images/DE-Lychee.png',
		'EE': 'images/EE-Sawgrass.png'
	};

	// 反馈图标
	const FEEDBACK_ICONS = {
		'correct': 'images/1CORRECT.png',
		'misplaced': 'images/2RESLOT.png',
		'half': 'images/3PARTIAL.png',
		'wrong': 'images/4INVALID.png'
	};

	// 原始二级元素列表（固定12种）
	const RAW_ELEMENTS = ['AA', 'AB', 'AD', 'BB', 'BC', 'BD', 'BE', 'CC', 'CD', 'DD', 'DE', 'EE'];

	// 转换为二阶植物名显示
	function elemToPlant(elem) {
		return SECOND_ORDER_NAMES[elem] || elem;
	}

	// 获取二阶植物图片
	function getPlantImage(elem) {
		return SECOND_ORDER_IMAGES[elem] || '';
	}

	// 所有可能答案（原始二级元素数组）
	const ALL_RAW_ANSWERS = (() => {
		const results = [];
		const elems = RAW_ELEMENTS;
		for (let i = 0; i < elems.length; i++) {
			for (let j = 0; j < elems.length; j++) {
				if (j === i) continue;
				for (let k = 0; k < elems.length; k++) {
					if (k === i || k === j) continue;
					for (let l = 0; l < elems.length; l++) {
						if (l === i || l === j || l === k) continue;
						results.push([elems[i], elems[j], elems[k], elems[l]]);
					}
				}
			}
		}
		return results;
	})(); // 11880

	// 反馈类型与颜色类
	const FB_TYPES = ['correct', 'misplaced', 'half', 'wrong'];
	const FB_LABELS = {
		'correct': '正确',
		'misplaced': '错位',
		'half': '半对',
		'wrong': '全错'
	};
	const FB_CLASSES = {
		'correct': 'fb-correct',
		'misplaced': 'fb-misplaced',
		'half': 'fb-half',
		'wrong': 'fb-wrong'
	};
	const FB_COLORS = {
		'correct': '#10b981',
		'misplaced': '#3b82f6',
		'half': '#ec4899',
		'wrong': '#ef4444'
	};

	// ==================== 反馈计算逻辑 ====================
	function parseElement(elem) {
		return [elem[0], elem[1]];
	}

	function countCharMatches(guessElem, answerElem) {
		const gChars = [guessElem[0], guessElem[1]];
		const aChars = [answerElem[0], answerElem[1]];
		let aUsed = [false, false];
		let matchCount = 0;
		for (const gc of gChars) {
			for (let j = 0; j < 2; j++) {
				if (!aUsed[j] && aChars[j] === gc) {
					aUsed[j] = true;
					matchCount++;
					break;
				}
			}
		}
		return matchCount;
	}

	function computeFeedback(answer, guess) {
		const n = 4;
		const feedback = new Array(n).fill(null);
		const answerConsumed = new Array(n).fill(false);

		for (let i = 0; i < n; i++) {
			if (guess[i] === answer[i]) {
				feedback[i] = 'correct';
				answerConsumed[i] = true;
			}
		}

		for (let i = 0; i < n; i++) {
			if (feedback[i] !== null) continue;
			const gElem = guess[i];
			let foundIdx = -1;
			for (let j = 0; j < n; j++) {
				if (!answerConsumed[j] && answer[j] === gElem && j !== i) {
					foundIdx = j;
					break;
				}
			}
			if (foundIdx !== -1) {
				feedback[i] = 'misplaced';
				answerConsumed[foundIdx] = true;
			}
		}

		for (let i = 0; i < n; i++) {
			if (feedback[i] !== null) continue;
			const matches = countCharMatches(guess[i], answer[i]);
			if (matches === 1) {
				feedback[i] = 'half';
			} else {
				feedback[i] = 'wrong';
			}
		}

		return feedback;
	}

	function feedbackKey(fb) {
		return fb.join('|');
	}

	// ==================== 求解器状态 ====================
	let possibleAnswers = ALL_RAW_ANSWERS.map(a => [...a]);
	let currentSuggestion = null;
	let solverHistory = [];
	let solved = false;

	// UI元素
	const s1 = document.getElementById('s1');
	const s2 = document.getElementById('s2');
	const s3 = document.getElementById('s3');
	const s4 = document.getElementById('s4');
	const img1 = document.getElementById('img1');
	const img2 = document.getElementById('img2');
	const img3 = document.getElementById('img3');
	const img4 = document.getElementById('img4');
	const possibleCountEl = document.getElementById('possibleCount');
	const solverMsg = document.getElementById('solverMsg');
	const historyBody = document.getElementById('solverHistoryBody');
	const noHistory = document.getElementById('noSolverHistory');
	const feedbackGrid = document.getElementById('feedbackGrid');

	const currentFeedback = { 0: null, 1: null, 2: null, 3: null };

	// 生成反馈按钮组（竖排4列）
	function buildFeedbackUI() {
		feedbackGrid.innerHTML = '';
		const labels = ['①', '②', '③', '④'];
		
		for (let i = 0; i < 4; i++) {
			const column = document.createElement('div');
			column.className = 'feedback-column';
			
			const colLabel = document.createElement('div');
			colLabel.className = 'fb-column-label';
			colLabel.textContent = labels[i];
			column.appendChild(colLabel);

			const btnGroup = document.createElement('div');
			btnGroup.className = 'fb-btn-group';
			btnGroup.dataset.slotIndex = i;

			FB_TYPES.forEach(type => {
				const btn = document.createElement('button');
				btn.className = 'fb-btn';
				btn.dataset.type = type;
				btn.dataset.slot = i;
				
				const icon = document.createElement('img');
				icon.className = 'fb-icon';
				icon.src = FEEDBACK_ICONS[type] || '';
				icon.alt = FB_LABELS[type];
				
				const text = document.createElement('span');
				text.textContent = FB_LABELS[type];
				
				btn.appendChild(icon);
				btn.appendChild(text);
				
				btn.addEventListener('click', function(e) {
					e.preventDefault();
					setFeedback(i, type);
				});
				btnGroup.appendChild(btn);
			});

			column.appendChild(btnGroup);
			feedbackGrid.appendChild(column);
		}
		
		for (let i = 0; i < 4; i++) {
			currentFeedback[i] = null;
			updateFeedbackButtons(i);
		}
	}

	function setFeedback(slotIndex, type) {
		if (solved) {
			solverMsg.innerHTML =
				'<div class="status-msg status-success">✅ 已确定最终序列，请点击重置。</div>';
			return;
		}
		currentFeedback[slotIndex] = type;
		updateFeedbackButtons(slotIndex);
	}

	function updateFeedbackButtons(slotIndex) {
		const btnGroup = feedbackGrid.querySelector(`.fb-btn-group[data-slot-index="${slotIndex}"]`);
		if (!btnGroup) return;
		const buttons = btnGroup.querySelectorAll('.fb-btn');
		buttons.forEach(btn => {
			btn.classList.remove('selected-correct', 'selected-misplaced', 'selected-half',
				'selected-wrong');
			if (currentFeedback[slotIndex] === btn.dataset.type) {
				btn.classList.add('selected-' + btn.dataset.type);
			}
		});
	}

	function getSelectedFeedback() {
		const fb = [];
		for (let i = 0; i < 4; i++) {
			fb.push(currentFeedback[i]);
		}
		if (fb.includes(null)) return null;
		return fb;
	}

	function setImageWithLoading(imgElement, src) {
		imgElement.classList.add('skeleton');
		imgElement.src = '';
		
		const tempImg = new Image();
		tempImg.onload = function() {
			imgElement.classList.remove('skeleton');
			imgElement.src = src;
		};
		tempImg.onerror = function() {
			// 加载失败，保持骨架图显示
			imgElement.classList.add('skeleton');
		};
		
		if (src) {
			tempImg.src = src;
		} else {
			imgElement.classList.remove('skeleton');
		}
	}

	function updateSuggestionDisplay(suggestion) {
		s1.textContent = elemToPlant(suggestion[0]);
		s2.textContent = elemToPlant(suggestion[1]);
		s3.textContent = elemToPlant(suggestion[2]);
		s4.textContent = elemToPlant(suggestion[3]);
		
		setImageWithLoading(img1, getPlantImage(suggestion[0]));
		setImageWithLoading(img2, getPlantImage(suggestion[1]));
		setImageWithLoading(img3, getPlantImage(suggestion[2]));
		setImageWithLoading(img4, getPlantImage(suggestion[3]));
	}

	function updatePossibleCount() {
		possibleCountEl.textContent = possibleAnswers.length;
	}

	function findBestGuess(candidates, sampleSize = 300) {
		if (candidates.length === 0) return null;
		if (candidates.length === 1) return candidates[0];

		let sample;
		if (candidates.length <= sampleSize) {
			sample = candidates;
		} else {
			const indices = new Set();
			while (indices.size < sampleSize) {
				indices.add(Math.floor(Math.random() * candidates.length));
			}
			sample = Array.from(indices).map(i => candidates[i]);
		}

		let bestGuess = null;
		let bestWorstCase = Infinity;
		let bestExpected = Infinity;

		for (const cand of sample) {
			const partitionMap = new Map();
			for (const ans of candidates) {
				const fb = computeFeedback(ans, cand);
				const key = feedbackKey(fb);
				partitionMap.set(key, (partitionMap.get(key) || 0) + 1);
			}
			let worstCase = 0;
			let sumSq = 0;
			for (const count of partitionMap.values()) {
				if (count > worstCase) worstCase = count;
				sumSq += count * count;
			}
			const expected = sumSq / candidates.length;

			if (worstCase < bestWorstCase || (worstCase === bestWorstCase && expected < bestExpected)) {
				bestWorstCase = worstCase;
				bestExpected = expected;
				bestGuess = cand;
			}
		}
		return bestGuess;
	}

	function computeInitialSuggestion() {
		possibleAnswers = ALL_RAW_ANSWERS.map(a => [...a]);
		solved = false;
		currentSuggestion = null;
		solverHistory = [];
		historyBody.innerHTML = '';
		noHistory.style.display = 'block';
		solverMsg.innerHTML = '';
		updatePossibleCount();
		
		s1.textContent = '计算中';
		s2.textContent = '计算中';
		s3.textContent = '计算中';
		s4.textContent = '计算中';
		img1.classList.add('skeleton');
		img1.src = '';
		img2.classList.add('skeleton');
		img2.src = '';
		img3.classList.add('skeleton');
		img3.src = '';
		img4.classList.add('skeleton');
		img4.src = '';
		
		for (let i = 0; i < 4; i++) {
			currentFeedback[i] = null;
			updateFeedbackButtons(i);
		}

		setTimeout(() => {
			const best = findBestGuess(possibleAnswers, 300);
			if (best) {
				currentSuggestion = best;
				updateSuggestionDisplay(best);
			}
		}, 40);
	}

	function resetSolver() {
		computeInitialSuggestion();
	}

	function submitFeedback() {
		if (solved) {
			solverMsg.innerHTML =
				'<div class="status-msg status-success">✅ 已确定最终序列，请点击重置。</div>';
			return;
		}
		if (!currentSuggestion) {
			solverMsg.innerHTML = '<div class="status-msg status-warn">⚠️ 建议计算中，请稍后。</div>';
			return;
		}
		const feedback = getSelectedFeedback();
		if (!feedback) {
			solverMsg.innerHTML =
				'<div class="status-msg status-warn">⚠️ 请为所有四个区域选择反馈类型。</div>';
			return;
		}

		const newPossible = [];
		for (const ans of possibleAnswers) {
			const expectedFb = computeFeedback(ans, currentSuggestion);
			if (feedbackKey(expectedFb) === feedbackKey(feedback)) {
				newPossible.push(ans);
			}
		}

		if (newPossible.length === 0) {
			solverMsg.innerHTML =
				'<div class="status-msg status-warn">⚠️ 此结果与游戏规则冲突，可能选择错误。</div>';
			return;
		}

		possibleAnswers = newPossible;
		solverHistory.push({
			suggestion: [...currentSuggestion],
			feedback: [...feedback],
			remaining: possibleAnswers.length
		});
		updatePossibleCount();
		solverMsg.innerHTML = '';

		const row = document.createElement('tr');
		row.dataset.index = solverHistory.length - 1;
		const h = solverHistory[solverHistory.length - 1];
		row.innerHTML = `
			<td><strong>${solverHistory.length}</strong></td>
			<td class="plant-cell" data-index="${solverHistory.length - 1}" data-slot="0">
				<div class="history-cell-content">
					<img class="history-plant-img" src="${getPlantImage(h.suggestion[0])}" alt="${elemToPlant(h.suggestion[0])}">
				</div>
			</td>
			<td class="plant-cell" data-index="${solverHistory.length - 1}" data-slot="1">
				<div class="history-cell-content">
					<img class="history-plant-img" src="${getPlantImage(h.suggestion[1])}" alt="${elemToPlant(h.suggestion[1])}">
				</div>
			</td>
			<td class="plant-cell" data-index="${solverHistory.length - 1}" data-slot="2">
				<div class="history-cell-content">
					<img class="history-plant-img" src="${getPlantImage(h.suggestion[2])}" alt="${elemToPlant(h.suggestion[2])}">
				</div>
			</td>
			<td class="plant-cell" data-index="${solverHistory.length - 1}" data-slot="3">
				<div class="history-cell-content">
					<img class="history-plant-img" src="${getPlantImage(h.suggestion[3])}" alt="${elemToPlant(h.suggestion[3])}">
				</div>
			</td>
			<td class="fb-cell editable-fb" data-index="${solverHistory.length - 1}" data-slot="0">
				<span class="feedback-badge ${FB_CLASSES[h.feedback[0]]}">${FB_LABELS[h.feedback[0]]}</span>
			</td>
			<td class="fb-cell editable-fb" data-index="${solverHistory.length - 1}" data-slot="1">
				<span class="feedback-badge ${FB_CLASSES[h.feedback[1]]}">${FB_LABELS[h.feedback[1]]}</span>
			</td>
			<td class="fb-cell editable-fb" data-index="${solverHistory.length - 1}" data-slot="2">
				<span class="feedback-badge ${FB_CLASSES[h.feedback[2]]}">${FB_LABELS[h.feedback[2]]}</span>
			</td>
			<td class="fb-cell editable-fb" data-index="${solverHistory.length - 1}" data-slot="3">
				<span class="feedback-badge ${FB_CLASSES[h.feedback[3]]}">${FB_LABELS[h.feedback[3]]}</span>
			</td>
			<td><strong>${h.remaining}</strong></td>
			<td>
				<button class="edit-btn" onclick="replayFromHistory(${solverHistory.length - 1})">
					<span>🔄</span>
				</button>
			</td>
		`;
		historyBody.appendChild(row);
		
		attachPlantCellClick(solverHistory.length - 1);
		attachFeedbackCellClick(solverHistory.length - 1);
		noHistory.style.display = 'none';

		for (let i = 0; i < 4; i++) {
			currentFeedback[i] = null;
			updateFeedbackButtons(i);
		}

		if (possibleAnswers.length === 1) {
			solved = true;
			currentSuggestion = possibleAnswers[0];
			updateSuggestionDisplay(currentSuggestion);
			solverMsg.innerHTML =
				'<div class="status-msg status-success">🎯 <strong>已确定最终序列！</strong></div>';
			document.querySelectorAll('.suggestion-slot').forEach(s => s.classList.add('highlight-pulse'));
		} else if (possibleAnswers.length > 1) {
			s1.textContent = '计算中';
			s2.textContent = '计算中';
			s3.textContent = '计算中';
			s4.textContent = '计算中';
			img1.classList.add('skeleton');
			img1.src = '';
			img2.classList.add('skeleton');
			img2.src = '';
			img3.classList.add('skeleton');
			img3.src = '';
			img4.classList.add('skeleton');
			img4.src = '';
			
			const currentPossible = possibleAnswers;
			setTimeout(() => {
				const sampleSize = currentPossible.length <= 200 ? currentPossible.length : Math.min(
					300, currentPossible.length);
				const best = findBestGuess(currentPossible, sampleSize);
				if (best) {
					currentSuggestion = best;
					updateSuggestionDisplay(best);
				}
			}, 30);
		}
	}

	// 生成合成图鉴
	function buildSynthesisGrid() {
		const synthesisGrid = document.getElementById('synthesisGrid');
		if (!synthesisGrid) return;
		
		const syntheses = [
			{ key: 'AA', first1: 'A', first2: 'A' },
			{ key: 'AB', first1: 'A', first2: 'B' },
			{ key: 'AD', first1: 'A', first2: 'D' },
			{ key: 'BB', first1: 'B', first2: 'B' },
			{ key: 'BC', first1: 'B', first2: 'C' },
			{ key: 'BD', first1: 'B', first2: 'D' },
			{ key: 'BE', first1: 'B', first2: 'E' },
			{ key: 'CC', first1: 'C', first2: 'C' },
			{ key: 'CD', first1: 'C', first2: 'D' },
			{ key: 'DD', first1: 'D', first2: 'D' },
			{ key: 'DE', first1: 'D', first2: 'E' },
			{ key: 'EE', first1: 'E', first2: 'E' }
		];

		syntheses.forEach(syn => {
			const item = document.createElement('div');
			item.className = 'synthesis-item';

			const row = document.createElement('div');
			row.className = 'synthesis-row';

			// 第一个一阶植物
			const plant1 = document.createElement('div');
			plant1.className = 'synthesis-plant';
			const img1 = document.createElement('img');
			img1.className = 'synthesis-img skeleton';
			img1.alt = PLANT_NAMES[syn.first1] || syn.first1;
			const name1 = document.createElement('div');
			name1.className = 'synthesis-name';
			name1.textContent = PLANT_NAMES[syn.first1] || syn.first1;
			loadImageWithSkeleton(img1, FIRST_ORDER_IMAGES[syn.first1]);
			plant1.appendChild(img1);
			plant1.appendChild(name1);

			// 加号
			const plus = document.createElement('span');
			plus.className = 'synthesis-operator';
			plus.textContent = '➕';

			// 第二个一阶植物
			const plant2 = document.createElement('div');
			plant2.className = 'synthesis-plant';
			const img2 = document.createElement('img');
			img2.className = 'synthesis-img skeleton';
			img2.alt = PLANT_NAMES[syn.first2] || syn.first2;
			const name2 = document.createElement('div');
			name2.className = 'synthesis-name';
			name2.textContent = PLANT_NAMES[syn.first2] || syn.first2;
			loadImageWithSkeleton(img2, FIRST_ORDER_IMAGES[syn.first2]);
			plant2.appendChild(img2);
			plant2.appendChild(name2);

			// 等号
			const equals = document.createElement('span');
			equals.className = 'synthesis-operator';
			equals.textContent = '🟰';

			// 二阶植物
			const plantResult = document.createElement('div');
			plantResult.className = 'synthesis-plant';
			const imgResult = document.createElement('img');
			imgResult.className = 'synthesis-img skeleton';
			imgResult.alt = SECOND_ORDER_NAMES[syn.key] || syn.key;
			const nameResult = document.createElement('div');
			nameResult.className = 'synthesis-name';
			nameResult.textContent = SECOND_ORDER_NAMES[syn.key] || syn.key;
			loadImageWithSkeleton(imgResult, SECOND_ORDER_IMAGES[syn.key]);
			plantResult.appendChild(imgResult);
			plantResult.appendChild(nameResult);

			row.appendChild(plant1);
			row.appendChild(plus);
			row.appendChild(plant2);
			row.appendChild(equals);
			row.appendChild(plantResult);

			item.appendChild(row);

			synthesisGrid.appendChild(item);
		});
	}

	function init() {
		initTheme();
		buildFeedbackUI();
		buildSynthesisGrid();
		computeInitialSuggestion();
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Enter' && document.activeElement && document.activeElement.closest('.fb-btn')) {
				e.preventDefault();
			} else if (e.key === 'Enter' && !e.target.closest('button')) {
				e.preventDefault();
				submitFeedback();
			}
		});
	}

	// 关闭所有弹出菜单
	function closeMenus() {
		document.querySelectorAll('.popup-menu').forEach(menu => menu.remove());
	}

	// 点击文档其他地方关闭菜单
	document.addEventListener('click', function(e) {
		if (!e.target.closest('.plant-cell') && !e.target.closest('.editable-fb') && !e.target.closest('.popup-menu')) {
			closeMenus();
		}
	});

	// 为植物单元格添加点击事件
	function attachPlantCellClick(historyIndex) {
		const cells = document.querySelectorAll(`.plant-cell[data-index="${historyIndex}"]`);
		cells.forEach(cell => {
			cell.addEventListener('click', function(e) {
				e.stopPropagation();
				closeMenus();
				const slot = parseInt(cell.dataset.slot);
				showPlantMenu(cell, historyIndex, slot);
			});
		});
	}

	// 显示植物选择菜单 - 悬浮选项
	function showPlantMenu(cell, historyIndex, slot) {
		const menu = document.createElement('div');
		menu.className = 'popup-menu plant-menu';
		
		RAW_ELEMENTS.forEach(elem => {
			const item = document.createElement('div');
			item.className = 'plant-menu-item';
			item.dataset.elem = elem;
			
			const img = document.createElement('img');
			img.className = 'skeleton';
			img.alt = elemToPlant(elem);
			
			const tempImg = new Image();
			tempImg.onload = function() {
				img.classList.remove('skeleton');
				img.src = getPlantImage(elem);
			};
			tempImg.onerror = function() {
				// 加载失败，保持骨架图
			};
			tempImg.src = getPlantImage(elem);
			
			const name = document.createElement('span');
			name.textContent = elemToPlant(elem);
			
			item.appendChild(img);
			item.appendChild(name);
			
			item.addEventListener('click', function(e) {
				e.stopPropagation();
				onPlantEdit(historyIndex, slot, elem);
				closeMenus();
			});
			
			menu.appendChild(item);
		});
		
		const rect = cell.getBoundingClientRect();
		const menuWidth = 140;
		const menuHeight = 200;
		let left = rect.left + rect.width / 2 - menuWidth / 2;
		let top = rect.top - menuHeight - 10;
		
		if (top < 10) {
			top = rect.bottom + 10;
		}
		if (left < 10) {
			left = 10;
		}
		if (left + menuWidth > window.innerWidth - 10) {
			left = window.innerWidth - menuWidth - 10;
		}
		
		menu.style.left = `${left}px`;
		menu.style.top = `${top}px`;
		document.body.appendChild(menu);
	}

	// 修改历史中的植物
	function onPlantEdit(historyIndex, slotIndex, newElem) {
		if (historyIndex >= solverHistory.length) return;
		solverHistory[historyIndex].suggestion[slotIndex] = newElem;
		
		const cell = document.querySelector(`.plant-cell[data-index="${historyIndex}"][data-slot="${slotIndex}"]`);
		if (cell) {
			const img = cell.querySelector('img');
			if (img) {
				img.src = getPlantImage(newElem);
				img.alt = elemToPlant(newElem);
			}
		}
	}

	// 为反馈单元格添加点击事件
	function attachFeedbackCellClick(historyIndex) {
		const cells = document.querySelectorAll(`.editable-fb[data-index="${historyIndex}"]`);
		cells.forEach(cell => {
			cell.addEventListener('click', function(e) {
				e.stopPropagation();
				closeMenus();
				const slot = parseInt(cell.dataset.slot);
				showFeedbackMenu(cell, historyIndex, slot);
			});
		});
	}

	// 显示反馈选择菜单 - 悬浮选项
	function showFeedbackMenu(cell, historyIndex, slot) {
		const menu = document.createElement('div');
		menu.className = 'popup-menu fb-menu';
		
		FB_TYPES.forEach(type => {
			const item = document.createElement('div');
			item.className = 'fb-menu-item';
			item.dataset.type = type;
			
			const img = document.createElement('img');
			img.src = FEEDBACK_ICONS[type];
			img.alt = FB_LABELS[type];
			
			const label = document.createElement('span');
			label.textContent = FB_LABELS[type];
			
			item.appendChild(img);
			item.appendChild(label);
			
			item.addEventListener('click', function(e) {
				e.stopPropagation();
				onFeedbackEdit(historyIndex, slot, type);
				closeMenus();
			});
			
			menu.appendChild(item);
		});
		
		const rect = cell.getBoundingClientRect();
		const menuWidth = 120;
		const menuHeight = 140;
		let left = rect.left + rect.width / 2 - menuWidth / 2;
		let top = rect.top - menuHeight - 10;
		
		if (top < 10) {
			top = rect.bottom + 10;
		}
		if (left < 10) {
			left = 10;
		}
		if (left + menuWidth > window.innerWidth - 10) {
			left = window.innerWidth - menuWidth - 10;
		}
		
		menu.style.left = `${left}px`;
		menu.style.top = `${top}px`;
		document.body.appendChild(menu);
	}

	// 编辑历史反馈
	function onFeedbackEdit(historyIndex, slotIndex, newValue) {
		if (historyIndex >= solverHistory.length) return;
		solverHistory[historyIndex].feedback[slotIndex] = newValue;
		
		const cell = document.querySelector(`.editable-fb[data-index="${historyIndex}"][data-slot="${slotIndex}"]`);
		if (cell) {
			cell.innerHTML = `<span class="feedback-badge ${FB_CLASSES[newValue]}">${FB_LABELS[newValue]}</span>`;
		}
	}

	// 从指定历史记录重新计算
	function replayFromHistory(historyIndex) {
		if (historyIndex >= solverHistory.length || historyIndex < 0) return;

		solved = false;
		possibleAnswers = ALL_RAW_ANSWERS.map(a => [...a]);

		// 重新计算每一步的剩余数量并更新历史记录
		for (let i = 0; i <= historyIndex; i++) {
			const h = solverHistory[i];
			const newPossible = [];
			for (const ans of possibleAnswers) {
				const expectedFb = computeFeedback(ans, h.suggestion);
				if (feedbackKey(expectedFb) === feedbackKey(h.feedback)) {
					newPossible.push(ans);
				}
			}
			if (newPossible.length === 0) {
				solverMsg.innerHTML =
					'<div class="status-msg status-warn">⚠️ 此结果与游戏规则冲突，可能选择错误。</div>';
				return;
			}
			possibleAnswers = newPossible;
			// 更新当前步骤的剩余数量
			solverHistory[i].remaining = possibleAnswers.length;
		}

		solverHistory = solverHistory.slice(0, historyIndex + 1);
		updatePossibleCount();
		solverMsg.innerHTML = '';

		// 更新表格中剩余列的显示
		const rows = historyBody.querySelectorAll('tr');
		for (let i = 0; i <= historyIndex && i < rows.length; i++) {
			const remainingCell = rows[i].querySelector('td:nth-child(10)');
			if (remainingCell) {
				remainingCell.innerHTML = `<strong>${solverHistory[i].remaining}</strong>`;
			}
		}

		for (let i = historyIndex + 1; i < rows.length; i++) {
			historyBody.removeChild(rows[i]);
		}

		if (solverHistory.length === 0) {
			noHistory.style.display = 'block';
		}

		if (possibleAnswers.length === 1) {
			solved = true;
			currentSuggestion = possibleAnswers[0];
			updateSuggestionDisplay(currentSuggestion);
			solverMsg.innerHTML =
				'<div class="status-msg status-success">🎯 <strong>已确定最终序列！</strong></div>';
			document.querySelectorAll('.suggestion-slot').forEach(s => s.classList.add('highlight-pulse'));
		} else {
			s1.textContent = '计算中';
			s2.textContent = '计算中';
			s3.textContent = '计算中';
			s4.textContent = '计算中';
			img1.classList.add('skeleton');
			img1.src = '';
			img2.classList.add('skeleton');
			img2.src = '';
			img3.classList.add('skeleton');
			img3.src = '';
			img4.classList.add('skeleton');
			img4.src = '';

			setTimeout(() => {
				const sampleSize = possibleAnswers.length <= 200 ? possibleAnswers.length : Math.min(
					300, possibleAnswers.length);
				const best = findBestGuess(possibleAnswers, sampleSize);
				if (best) {
					currentSuggestion = best;
					updateSuggestionDisplay(best);
				}
			}, 30);
		}
	}

	// 折叠Card切换函数
	window.toggleCollapse = function(card) {
		card.classList.toggle('active');
	};

	window.addEventListener('DOMContentLoaded', init);
	window.resetSolver = resetSolver;
	window.submitFeedback = submitFeedback;
	window.onFeedbackEdit = onFeedbackEdit;
	window.replayFromHistory = replayFromHistory;
})();