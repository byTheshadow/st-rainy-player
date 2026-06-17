// ═══════════════════════════════════════════════════════════════
// 🌧️ 雨季播放器 (Rainy Player) · SillyTavern Extension
// 版本: 0.1.0
// 描述: 蓝白清新风格的ST 功能播放器
// ═══════════════════════════════════════════════════════════════

(function () {
    'use strict';

    // ═══════════════════════════════════════
    // 📦 SECTION 1: 常量& 配置
    // ═══════════════════════════════════════

    const PLUGIN_NAME = 'rainy-player';
    const EXTENSION_PATH = `scripts/extensions/third_party/${PLUGIN_NAME}`;

    // 频道定义
    const CHANNELS = [
        { id: 'theater',icon: '🎬', label: '小剧场' },
        { id: 'radio',    icon: '📻', label: '电台' },
        { id: 'summary',  icon: '📋', label: '摘要' },
        { id: 'gallery',  icon: '🎨', label: '画廊' },
        { id: 'settings', icon: '⚙️', label: '设置' },
    ];

    // 默认设置
    const DEFAULT_SETTINGS = {
        sub_api: {
            url: '',
            key: '',
            model: '',
            max_tokens: 2000,
            temperature: 0.9,
        },
        nai: {
            key: '',
            model: 'nai-diffusion-4-5',
            sampler: 'k_euler_ancestral',
            steps: 28,
            cfg_scale: 5,
            width: 832,
            height: 1216,
            negative_prompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers',
        },
        comfyui: {
            url: 'http://127.0.0.1:8188',
            workflow: null,
            positive_node_id: '6',
            negative_node_id: '7',
        },
        gallery: {
            prefix: 'masterpiece, best quality',},
        theater: {
            types: [
                { id: 'daily', name: '日常', prompt: '基于当前对话的角色和场景，生成一段轻松有趣的日常番外小故事。保持角色性格一致，字数300-500字。' },
                { id: 'romantic', name: '甜蜜', prompt: '基于当前对话的角色和场景，生成一段温馨甜蜜的番外小故事。保持角色性格一致，字数300-500字。' },
                { id: 'adventure', name: '冒险', prompt: '基于当前对话的角色和场景，生成一段紧张刺激的冒险番外小故事。保持角色性格一致，字数300-500字。' },
            ],
        },
        summary: {
            qr_name: '总结',
        },
        fab_position: { x: null, y: null },
    };

    // ═══════════════════════════════════════
    // 📦 SECTION 2: Storage存储封装
    // ═══════════════════════════════════════

    const PREFIX = 'rainy_';

    const storage = {
        get(key, defaultVal = null) {
            try {
                const raw = localStorage.getItem(PREFIX + key);
                return raw ? JSON.parse(raw) : defaultVal;
            } catch {
                return defaultVal;
            }
        },

        set(key, val) {
            try {
                localStorage.setItem(PREFIX + key, JSON.stringify(val));
            } catch (e) {
                console.error('[RainyPlayer] Storage set error:', e);
            }
        },

        update(key, defaultVal, updater) {
            const current = this.get(key, defaultVal);
            const updated = updater(current);
            this.set(key, updated);
            return updated;
        },

        remove(key) {
            localStorage.removeItem(PREFIX + key);
        },
    };

    // 设置的便捷读写
    function getSettings() {
        return storage.get('settings', { ...DEFAULT_SETTINGS });
    }

    function saveSettings(settings) {
        storage.set('settings', settings);
    }

    function updateSettings(updater) {
        const current = getSettings();
        const merged = deepMerge(DEFAULT_SETTINGS, current);
        const updated = updater(merged);
        saveSettings(updated);
        return updated;
    }

    // 深度合并工具
    function deepMerge(target, source) {
        const result = { ...target };
        for (const key of Object.keys(source)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 3: 简易事件总线
    // ═══════════════════════════════════════

    const EventBus = {
        _listeners: {},

        on(event, callback) {
            if (!this._listeners[event]) this._listeners[event] = [];
            this._listeners[event].push(callback);
        },

        off(event, callback) {
            if (!this._listeners[event]) return;
            this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
        },

        emit(event, ...args) {
            if (!this._listeners[event]) return;
            for (const cb of this._listeners[event]) {
                try { cb(...args); } catch (e) { console.error(`[RainyPlayer] EventBus error on "${event}":`, e); }
            }
        },
    };

    // 内部事件名
    const RainyEvents = {
        SETTINGS_CHANGED: 'settings_changed',
        API_STATUS_CHANGED: 'api_status_changed',
        CHANNEL_CHANGED: 'channel_changed',
    };

    // ═══════════════════════════════════════
    // 📦 SECTION 4: 副API 封装
    // ═══════════════════════════════════════

    // 获取模型列表
    async function fetchModelList(url, key) {
        if (!url) throw new Error('请先填写 API 地址');

        // 确保 URL 格式正确
        let baseUrl = url.replace(/\/+$/, '');
        if (!baseUrl.includes('/v1')) {
            baseUrl += '/v1';
        }

        const resp = await fetch(`${baseUrl}/models`, {
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
        });

        if (!resp.ok) {
            throw new Error(`获取模型列表失败: ${resp.status} ${resp.statusText}`);
        }

        const data = await resp.json();
        if (data.data && Array.isArray(data.data)) {
            return data.data.map(m => m.id);
        }
        throw new Error('返回格式不正确，无法解析模型列表');
    }

    // 副 API 生成（通过 generateRaw）
    // 注意：generateRaw 是 ST 提供的全局函数，需要在 ST 环境中才能调用
    async function subApiGenerate({ ordered_prompts, max_chat_history = 20, stream = false, onStream = null }) {
        const settings = getSettings();
        const subApi = settings.sub_api;

        if (!subApi.url || !subApi.model) {
            throw new Error('请先在设置中配置副 API');
        }

        // 检查 generateRaw 是否可用
        if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) {
            throw new Error('SillyTavern 环境不可用');
        }

        const context = SillyTavern.getContext();

        const config = {
            custom_api: {
                apiurl: subApi.url,
                key: subApi.key,
                model: subApi.model,
                max_tokens: subApi.max_tokens,
                temperature: subApi.temperature,
            },
            ordered_prompts,
            max_chat_history,
            should_stream: stream,
            should_silence: true,
        };

        // 更新状态
        setApiStatus('generating');

        try {
            const result = await context.generateRaw(config);
            setApiStatus('connected');
            return result;
        } catch (e) {
            setApiStatus('error');
            throw e;
        }
    }

    // API 状态管理
    let currentApiStatus = 'idle'; // idle | connected | generating | error

    function setApiStatus(status) {
        currentApiStatus = status;
        EventBus.emit(RainyEvents.API_STATUS_CHANGED, status);
        updateStatusBar(status);
    }

    //═══════════════════════════════════════
    // 📦 SECTION 5: Toast 提示
    // ═══════════════════════════════════════

    let toastContainer = null;

    function showToast(message, type = 'info', duration = 3000) {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'rainy-toast-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `rainy-toast is-${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('is-hiding');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 6: UI 构建 -悬浮球
    // ═══════════════════════════════════════

    function createFAB() {
        const fab = document.createElement('button');
        fab.className = 'rainy-fab';
        fab.title = '雨季播放器';
        fab.innerHTML = `
            <svg class="rainy-fab-icon" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                      fill="none" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 12l2-6 2 8 2-4 22"
                      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="6" r="1" fill="currentColor" opacity="0.6"/>
                <circle cx="18" cy="8" r="0.8" fill="currentColor" opacity="0.4"/>
                <circle cx="8" cy="18" r="0.6" fill="currentColor" opacity="0.5"/>
            </svg>
        `;
        return fab;
    }

    //悬浮球拖拽逻辑（同时支持 mouse 和 touch）
    function makeDraggable(fab) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        let hasMoved = false;

        function onStart(e) {
            // 获取坐标（兼容 touch 和 mouse）
            const point = e.touches ? e.touches[0] : e;
            startX = point.clientX;
            startY = point.clientY;

            const rect = fab.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            hasMoved = false;
            isDragging = true;

            fab.classList.add('is-dragging');

            // 阻止触摸设备的页面滚动
            if (e.touches) e.preventDefault();
        }

        function onMove(e) {
            if (!isDragging) return;

            const point = e.touches ? e.touches[0] : e;
            const dx = point.clientX - startX;
            const dy = point.clientY - startY;

            // 移动距离 >= 5px 才视为拖拽
            if (Math.abs(dx) >= 5 || Math.abs(dy) >= 5) {
                hasMoved = true;
            }

            if (hasMoved) {
                let newLeft = startLeft + dx;
                let newTop = startTop + dy;

                // 边界限制
                const fabSize = fab.offsetWidth;
                const maxX = window.innerWidth - fabSize;
                const maxY = window.innerHeight - fabSize;
                newLeft = Math.max(0, Math.min(newLeft, maxX));
                newTop = Math.max(0, Math.min(newTop, maxY));

                // 用left/top 定位（覆盖 right/bottom）
                fab.style.right = 'auto';
                fab.style.bottom = 'auto';
                fab.style.left = newLeft + 'px';
                fab.style.top = newTop + 'px';

                if (e.touches) e.preventDefault();
            }
        }

        function onEnd() {
            if (!isDragging) return;
            isDragging = false;
            fab.classList.remove('is-dragging');

            if (hasMoved) {
                // 保存位置
                const rect = fab.getBoundingClientRect();
                updateSettings(s => {
                    s.fab_position = { x: rect.left, y: rect.top };
                    return s;
                });
            } else {
                // 没有移动 → 视为点击 → 切换面板
                togglePanel();
            }
        }

        // Mouse 事件
        fab.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);

        // Touch 事件
        fab.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }

    // 恢复悬浮球位置
    function restoreFABPosition(fab) {
        const settings = getSettings();
        const pos = settings.fab_position;
        if (pos && pos.x !== null && pos.y !== null) {
            fab.style.right = 'auto';
            fab.style.bottom = 'auto';
            fab.style.left = pos.x + 'px';
            fab.style.top = pos.y + 'px';
        }
    }

    //═══════════════════════════════════════
    // 📦 SECTION 7: UI 构建 - 主面板
    // ═══════════════════════════════════════

    let panelEl = null;
    let isPanelOpen = false;
    let currentChannel = 'theater';

    function createMainPanel() {
        const panel = document.createElement('div');
        panel.className = 'rainy-panel';
        panel.id = 'rainy-panel';

        panel.innerHTML = `
            <!-- 标题栏 -->
            <div class="rainy-header">
                <div class="rainy-header-left">
                    <div class="rainy-header-dot"></div>
                    <span class="rainy-header-title">Rainy Player</span>
                </div>
                <button class="rainy-close-btn" title="关闭">✕</button>
            </div>

            <!-- Tab 栏 -->
            <div class="rainy-tabs">
                ${CHANNELS.map(ch => `
                    <button class="rainy-tab ${ch.id === currentChannel ? 'is-active' : ''}"
                            data-channel="${ch.id}" title="${ch.label}">
                <span class="rainy-tab-icon">${ch.icon}</span>
                        <span class="rainy-tab-label">${ch.label}</span>
                    </button>
                `).join('')}
            </div>

            <!-- 内容区 -->
            <div class="rainy-content" id="rainy-content">
                ${CHANNELS.map(ch => `
                    <div class="rainy-app-page ${ch.id === currentChannel ? 'is-active' : ''}" 
                         data-page="${ch.id}" id="rainy-page-${ch.id}"></div>
                `).join('')}
            </div>

            <!-- 底部状态栏 -->
            <div class="rainy-statusbar">
                <div class="rainy-status-text">
                    <span class="rainy-status-dot" id="rainy-status-dot"></span>
                    <span id="rainy-status-label">就绪</span>
                </div>
                <span class="rainy-status-text" id="rainy-status-model" style="font-size:10px;"></span>
            </div>
        `;

        // 绑定事件
        // 关闭按钮
        panel.querySelector('.rainy-close-btn').addEventListener('click', () => closePanel());

        // Tab 切换
        panel.querySelectorAll('.rainy-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const channelId = tab.dataset.channel;
                switchChannel(channelId);
            });
        });

        return panel;
    }

    function togglePanel() {
        if (isPanelOpen) {
            closePanel();
        } else {
            openPanel();
        }
    }

    function openPanel() {
        if (!panelEl) return;
        isPanelOpen = true;
        panelEl.classList.add('is-open');

        // 首次打开时初始化当前频道
        initChannelIfNeeded(currentChannel);
    }

    function closePanel() {
        if (!panelEl) return;
        isPanelOpen = false;
        panelEl.classList.remove('is-open');
    }

    function switchChannel(channelId) {
        if (channelId === currentChannel) return;

        currentChannel = channelId;

        // 更新 Tab 高亮
        panelEl.querySelectorAll('.rainy-tab').forEach(tab => {
            tab.classList.toggle('is-active', tab.dataset.channel === channelId);
        });

        // 更新页面显示
        panelEl.querySelectorAll('.rainy-app-page').forEach(page => {
            page.classList.toggle('is-active', page.dataset.page === channelId);
        });

        // 初始化频道（如果还没初始化过）
        initChannelIfNeeded(channelId);

        EventBus.emit(RainyEvents.CHANNEL_CHANGED, channelId);
    }

    //═══════════════════════════════════════
    // 📦 SECTION 8: 频道初始化管理
    // ═══════════════════════════════════════

    const initializedChannels = new Set();

    function initChannelIfNeeded(channelId) {
        if (initializedChannels.has(channelId)) return;
        initializedChannels.add(channelId);

        const container = document.getElementById(`rainy-page-${channelId}`);
        if (!container) return;

        switch (channelId) {
            case 'theater':
                initTheaterPage(container);
                break;
            case 'radio':
                initRadioPage(container);
                break;
            case 'summary':
                initSummaryPage(container);
                break;
            case 'gallery':
                initGalleryPage(container);
                break;
            case 'settings':
                initSettingsPage(container);
                break;
        }
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 9: 状态栏更新
    // ═══════════════════════════════════════

    function updateStatusBar(status) {
        const dot = document.getElementById('rainy-status-dot');
        const label = document.getElementById('rainy-status-label');
        const modelLabel = document.getElementById('rainy-status-model');

        if (!dot || !label) return;

        // 清除所有状态类
        dot.classList.remove('is-connected', 'is-generating', 'is-error');

        switch (status) {
            case 'connected':
                dot.classList.add('is-connected');
                label.textContent = '已连接';
                break;
            case 'generating':
                dot.classList.add('is-generating');
                label.textContent = '生成中...';
                break;
            case 'error':
                dot.classList.add('is-error');
                label.textContent = '连接错误';
                break;
            default:
                label.textContent = '就绪';
        }

        // 显示当前模型
        if (modelLabel) {
            const settings = getSettings();
            const model = settings.sub_api?.model;
            modelLabel.textContent = model ? model.split('/').pop() : '';
        }
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 10: 小剧场页面（Phase 2完善）
    // ═══════════════════════════════════════

    function initTheaterPage(container) {
        const settings = getSettings();
        const types = settings.theater?.types || DEFAULT_SETTINGS.theater.types;

        container.innerHTML = `
            <div class="rainy-theater-types" id="rainy-theater-types">
                ${types.map((t, i) => `
                    <button class="rainy-theater-type-btn ${i === 0 ? 'is-active' : ''}" 
                            data-type-id="${t.id}">${t.name}</button>
                `).join('')}
            </div>

            <div class="rainy-theater-output" id="rainy-theater-output">
                <div class="rainy-empty">
                    <div class="rainy-empty-icon">🎬</div>
                    <div class="rainy-empty-text">选择类型，点击生成按钮<br>开始你的番外小剧场</div>
                </div>
            </div>

            <div class="rainy-theater-actions">
                <button class="rainy-btn rainy-btn-primary" id="rainy-theater-generate">
                    ▶ 生成
                </button>
                <button class="rainy-btn rainy-btn-secondary" id="rainy-theater-reroll" disabled>
                    🔄 重Roll
                </button>
                <button class="rainy-btn rainy-btn-secondary rainy-btn-sm" id="rainy-theater-export" disabled>
                    📤 导出
                </button>
            </div>

            <div class="rainy-divider"></div>

            <div style="font-size:12px; color:var(--rainy-text-muted); margin-bottom:8px;">📜 历史记录</div>
            <div id="rainy-theater-history">
                <div class="rainy-empty">
                    <div class="rainy-empty-text" style="font-size:12px;">暂无历史记录</div>
                </div>
            </div>
        `;

        // 类型选择
        let selectedTypeId = types[0]?.id;
        container.querySelectorAll('.rainy-theater-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.rainy-theater-type-btn').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                selectedTypeId = btn.dataset.typeId;
            });
        });

        // 生成按钮（Phase 2 实现完整逻辑）
        container.querySelector('#rainy-theater-generate').addEventListener('click', async () => {
            const type = types.find(t => t.id === selectedTypeId);
            if (!type) return;

            const outputEl = container.querySelector('#rainy-theater-output');
            const generateBtn = container.querySelector('#rainy-theater-generate');
            const rerollBtn = container.querySelector('#rainy-theater-reroll');
            const exportBtn = container.querySelector('#rainy-theater-export');

            generateBtn.disabled = true;
            outputEl.innerHTML = `
                <div class="rainy-loading">
                    <div class="rainy-loading-dot"></div>
                    <div class="rainy-loading-dot"></div>
                    <div class="rainy-loading-dot"></div>
                </div>
            `;

            try {
                const result = await subApiGenerate({
                    ordered_prompts: [
                        'char_description',
                        'char_personality',
                        'chat_history',
                        { role: 'system', content: type.prompt },
                        { role: 'user', content: '请生成小剧场。' },
                    ],
                    max_chat_history: 20,
                });

                outputEl.textContent = result;
                rerollBtn.disabled = false;
                exportBtn.disabled = false;

                // 存入历史
                const historyItem = {
                    id: crypto.randomUUID(),
                    type_id: type.id,
                    type_name: type.name,
                    content: result,
                    created_at: Date.now(),
                    starred: false,
                };
                storage.update('theater_history', [], list => {
                    list.unshift(historyItem);
                    return list.slice(0, 50); // 最多保留50条
                });

                refreshTheaterHistory(container);
            } catch (e) {
                outputEl.innerHTML = `<div class="rainy-empty"><div class="rainy-empty-text" style="color:#ef4444;">生成失败: ${e.message}</div></div>`;
                showToast('小剧场生成失败: ' + e.message, 'error');
            } finally {
                generateBtn.disabled = false;
            }
        });

        // 重Roll
        container.querySelector('#rainy-theater-reroll').addEventListener('click', () => {
            container.querySelector('#rainy-theater-generate').click();
        });

        // 导出
        container.querySelector('#rainy-theater-export').addEventListener('click', () => {
            const content = container.querySelector('#rainy-theater-output').textContent;
            if (!content) return;
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `小剧场_${new Date().toLocaleDateString()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('已导出', 'success');
        });

        // 加载历史
        refreshTheaterHistory(container);
    }

    function refreshTheaterHistory(container) {
        const historyEl = container.querySelector('#rainy-theater-history');
        const history = storage.get('theater_history', []);

        if (history.length === 0) {
            historyEl.innerHTML = `<div class="rainy-empty"><div class="rainy-empty-text" style="font-size:12px;">暂无历史记录</div></div>`;
            return;
        }

        historyEl.innerHTML = history.slice(0, 10).map(item => `
            <div class="rainy-card" style="cursor:pointer;" data-history-id="${item.id}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-size:11px; color:var(--rainy-accent); font-weight:600;">${item.type_name}</span>
                    <span style="font-size:10px; color:var(--rainy-text-muted);">${new Date(item.created_at).toLocaleString()}</span>
                </div>
                <div style="font-size:12px; color:var(--rainy-text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    ${item.content.substring(0, 60)}...
                </div>
            </div>
        `).join('');

        // 点击历史记录 → 显示内容
        historyEl.querySelectorAll('.rainy-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.historyId;
                const item = history.find(h => h.id === id);
                if (item) {
                    container.querySelector('#rainy-theater-output').textContent = item.content;
                    container.querySelector('#rainy-theater-export').disabled = false;
                }
            });
        });
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 11: 世界电台页面（Phase 3 完善）
    // ═══════════════════════════════════════

    function initRadioPage(container) {
        container.innerHTML = `
            <div class="rainy-radio-marquee-wrap">
                <div class="rainy-radio-marquee" id="rainy-radio-marquee">
                    📡 世界电台 · 正在调频点击下方按钮接收最新广播 📡
                </div>
            </div>

            <div id="rainy-radio-news">
                <div class="rainy-empty">
                    <div class="rainy-empty-icon">📻</div>
                    <div class="rainy-empty-text">点击"调频"按钮<br>接收来自这个世界的新闻播报</div>
                </div>
            </div>

            <div style="margin-top:16px; display:flex; gap:8px;">
                <button class="rainy-btn rainy-btn-primary" id="rainy-radio-tune" style="flex:1;">
                    📡 调频
                </button></div>

            <div class="rainy-divider"></div>

            <div style="font-size:12px; color:var(--rainy-text-muted); margin-bottom:8px;">📜 广播历史</div>
            <div id="rainy-radio-history">
                <div class="rainy-empty">
                    <div class="rainy-empty-text" style="font-size:12px;">暂无广播记录</div>
                </div>
            </div>
        `;

        // 调频按钮
        container.querySelector('#rainy-radio-tune').addEventListener('click', async () => {
            const newsEl = container.querySelector('#rainy-radio-news');
            const tuneBtn = container.querySelector('#rainy-radio-tune');
            const marquee = container.querySelector('#rainy-radio-marquee');

            tuneBtn.disabled = true;
            marquee.textContent = '📡 正在接收信号...';
            newsEl.innerHTML = `
                <div class="rainy-loading">
                    <div class="rainy-loading-dot"></div>
                    <div class="rainy-loading-dot"></div>
                    <div class="rainy-loading-dot"></div>
                </div>
            `;

            try {
                const result = await subApiGenerate({
                    ordered_prompts: [
                        'world_info_before',
                        'char_description',
                        'world_info_after',
                        { role: 'system', content: '你是这个世界中的广播电台主播。基于世界观设定，用生动的播报风格播报3条世界新闻。每条新闻用【标题】和正文的格式。新闻应该与世界观相关、有趣、有细节感。' },
                        { role: 'user', content: '开始播报。' },
                    ],
                    max_chat_history: 10,
                });

                // 解析新闻（简单按【】分割）
                const newsItems = parseRadioNews(result);
                renderRadioNews(newsEl, newsItems, result);

                marquee.textContent = `📡 ${newsItems.length} 条新闻已接收 · ${new Date().toLocaleTimeString()}`;

                // 存入历史
                storage.update('radio_history', [], list => {
                    list.unshift({
                        id: crypto.randomUUID(),
                        content: result,
                        created_at: Date.now(),
                });
                    return list.slice(0, 20);
                });

            } catch (e) {
                newsEl.innerHTML = `<div class="rainy-empty"><div class="rainy-empty-text" style="color:#ef4444;">接收失败: ${e.message}</div></div>`;
                marquee.textContent = '📡 信号中断...';
                showToast('电台接收失败: ' + e.message, 'error');
            } finally {
                tuneBtn.disabled = false;
            }
        });
    }

    function parseRadioNews(text) {
        //尝试按【标题】格式解析
        const regex = /【(.+?)】([\s\S]*?)(?=【|$)/g;
        const items = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            items.push({
                title: match[1].trim(),
                body: match[2].trim(),
            });
        }
        // 如果解析失败，整段作为一条
        if (items.length === 0) {
            items.push({ title: '广播速报', body: text });
        }
        return items;
    }

    function renderRadioNews(container, items, rawText) {
        container.innerHTML = items.map(item => `
            <div class="rainy-radio-news-card">
                <div class="rainy-radio-news-title">${item.title}</div>
                <div class="rainy-radio-news-body">${item.body}</div>
            </div>
        `).join('');
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 12: 摘要站页面（Phase 3 完善）
    // ═══════════════════════════════════════

    function initSummaryPage(container) {
        const settings = getSettings();

        container.innerHTML = `
            <div style="font-size:13px; color:var(--rainy-text-secondary); margin-bottom:12px;">
                从聊天记录中提取 <code style="background:var(--rainy-bg-card); padding:2px 6px; border-radius:4px; font-size:12px;">&lt;meow_FM&gt;</code> 标签内的摘要内容
            </div>

            <div class="rainy-summary-content" id="rainy-summary-content">
                <div class="rainy-empty">
                    <div class="rainy-empty-icon">📋</div>
                    <div class="rainy-empty-text">点击"刷新"读取最新摘要</div>
                </div>
            </div>

            <div class="rainy-summary-actions">
                <button class="rainy-btn rainy-btn-primary" id="rainy-summary-refresh">
                    🔄 刷新摘要
                </button><button class="rainy-btn rainy-btn-secondary" id="rainy-summary-trigger-qr">
                    📝 发送总结指令
                </button>
            </div>
        `;

        // 刷新摘要
        container.querySelector('#rainy-summary-refresh').addEventListener('click', async () => {
            const contentEl = container.querySelector('#rainy-summary-content');

            try {
                if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) {
                    throw new Error('SillyTavern 环境不可用');
                }

                const context = SillyTavern.getContext();
                const chat = context.chat;

                if (!chat || chat.length === 0) {
                    contentEl.innerHTML = `<div class="rainy-empty"><div class="rainy-empty-text">当前没有聊天记录</div></div>`;
                    return;
                }

                // 从后往前找 <meow_FM> 标签
                let found = null;
                for (let i = chat.length - 1; i >= 0; i--) {
                    const msg = chat[i];
                    const content = msg.mes || msg.message || '';
                    const match = content.match(/<meow_FM>([\s\S]*?)<\/meow_FM>/);
                    if (match) {
                        found = match[1].trim();
                        break;
                    }
                }

                if (found) {
                    contentEl.textContent = found;
                    contentEl.style.whiteSpace = 'pre-wrap';
                } else {
                    contentEl.innerHTML = `<div class="rainy-empty"><div class="rainy-empty-text">未找到 &lt;meow_FM&gt; 标签内容<br>请先让 AI 生成包含此标签的摘要</div></div>`;
                }
            } catch (e) {
                contentEl.innerHTML = `<div class="rainy-empty"><div class="rainy-empty-text" style="color:#ef4444;">读取失败: ${e.message}</div></div>`;
            }
        });

        // 触发 QR
        container.querySelector('#rainy-summary-trigger-qr').addEventListener('click', async () => {
            try {
                const settings = getSettings();
                const qrName = settings.summary?.qr_name || '总结';

                if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) {
                    throw new Error('SillyTavern 环境不可用');
                }

                const context = SillyTavern.getContext();
                await context.executeSlashCommands(`/trigger qr="${qrName}"`);
                showToast(`已触发 QR: ${qrName}`, 'success');
            } catch (e) {
                showToast('触发 QR 失败: ' + e.message, 'error');
            }
        });
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 13: 画廊页面（Phase 4 完善）
    // ═══════════════════════════════════════

    function initGalleryPage(container) {
        container.innerHTML = `
            <div class="rainy-empty">
                <div class="rainy-empty-icon">🎨</div>
                <div class="rainy-empty-text">
                    画廊功能将在后续版本中实现<br>
                    <span style="font-size:11px; color:var(--rainy-text-muted);">支持 NAI / ComfyUI 生图</span>
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 14: 设置页面
    // ═══════════════════════════════════════

    function initSettingsPage(container) {
        const settings = getSettings();

        container.innerHTML = `
            <!-- 副API 设置 -->
            <div class="rainy-settings-section">
                <div class="rainy-settings-section-title">副 API 配置</div>

                <div class="rainy-field">
                    <label class="rainy-field-label">API地址</label>
                    <input class="rainy-input" type="text" id="rainy-set-api-url" 
                           placeholder="https://api.example.com/v1"
                           value="${settings.sub_api?.url || ''}">
                    <div class="rainy-field-hint">OpenAI 兼容格式的 API 地址</div>
                </div>

                <div class="rainy-field">
                    <label class="rainy-field-label">API Key</label>
                    <input class="rainy-input" type="password" id="rainy-set-api-key" 
                           placeholder="sk-..." 
                           value="${settings.sub_api?.key || ''}"></div>

                <div class="rainy-field">
                    <label class="rainy-field-label">模型</label>
                    <div class="rainy-input-row">
                        <div class="rainy-field">
                            <select class="rainy-select" id="rainy-set-api-model">
                                ${settings.sub_api?.model
                                    ? `<option value="${settings.sub_api.model}" selected>${settings.sub_api.model}</option>`
                                    : '<option value="">请先获取模型列表</option>'
                                }
                            </select>
                        </div>
                        <button class="rainy-btn rainy-btn-secondary rainy-btn-sm" id="rainy-set-fetch-models">
                            获取列表
                        </button>
                    </div>
                    <div class="rainy-field-hint" id="rainy-set-model-hint"></div>
                </div>

                <div class="rainy-field">
                    <label class="rainy-field-label">最大 Tokens</label>
                    <div class="rainy-slider-row">
                        <input type="range" id="rainy-set-max-tokens" 
                               min="256" max="8192" step="256" 
                               value="${settings.sub_api?.max_tokens || 2000}">
                        <span class="rainy-slider-value" id="rainy-set-max-tokens-val">
                            ${settings.sub_api?.max_tokens || 2000}
                        </span>
                    </div>
                </div>

                <div class="rainy-field">
                    <label class="rainy-field-label">Temperature</label>
                    <div class="rainy-slider-row">
                        <input type="range" id="rainy-set-temperature" 
                               min="0" max="2" step="0.1" 
                               value="${settings.sub_api?.temperature || 0.9}">
                        <span class="rainy-slider-value" id="rainy-set-temperature-val">
                            ${settings.sub_api?.temperature || 0.9}
                        </span>
                    </div>
                </div>
            </div>

            <!-- NAI 设置 -->
            <div class="rainy-settings-section">
                <div class="rainy-settings-section-title">NAI 绘图配置</div>

                <div class="rainy-field">
                    <label class="rainy-field-label">NAI API Key</label>
                    <input class="rainy-input" type="password" id="rainy-set-nai-key" 
                           placeholder="pst-..." 
                           value="${settings.nai?.key || ''}"></div>

                <div class="rainy-field">
                    <label class="rainy-field-label">模型</label>
                    <select class="rainy-select" id="rainy-set-nai-model">
                        <option value="nai-diffusion-4-5" ${settings.nai?.model === 'nai-diffusion-4-5' ? 'selected' : ''}>NAI Diffusion V4.5</option>
                        <option value="nai-diffusion-4" ${settings.nai?.model === 'nai-diffusion-4' ? 'selected' : ''}>NAI Diffusion V4</option>
                        <option value="nai-diffusion-3" ${settings.nai?.model === 'nai-diffusion-3' ? 'selected' : ''}>NAI Diffusion V3</option>
                    </select>
                </div>

                <div class="rainy-input-row" style="margin-bottom:12px;">
                    <div class="rainy-field">
                        <label class="rainy-field-label">宽度</label>
                        <input class="rainy-input" type="number" id="rainy-set-nai-width" 
                               value="${settings.nai?.width || 832}" step="64">
                    </div>
                    <div class="rainy-field">
                        <label class="rainy-field-label">高度</label>
                        <input class="rainy-input" type="number" id="rainy-set-nai-height" 
                               value="${settings.nai?.height || 1216}" step="64">
                    </div>
                </div>

                <div class="rainy-input-row" style="margin-bottom:12px;">
                    <div class="rainy-field">
                        <label class="rainy-field-label">Steps</label>
                        <input class="rainy-input" type="number" id="rainy-set-nai-steps" 
                               value="${settings.nai?.steps || 28}" min="1" max="50">
                    </div>
                    <div class="rainy-field">
                        <label class="rainy-field-label">CFG Scale</label>
                        <input class="rainy-input" type="number" id="rainy-set-nai-cfg" 
                               value="${settings.nai?.cfg_scale || 5}" min="1" max="30" step="0.5">
                    </div>
                </div>

                <div class="rainy-field">
                    <label class="rainy-field-label">负面提示词</label>
                    <textarea class="rainy-textarea" id="rainy-set-nai-negative" rows="2">${settings.nai?.negative_prompt || ''}</textarea>
                </div>
            </div>

            <!-- ComfyUI 设置 -->
            <div class="rainy-settings-section">
                <div class="rainy-settings-section-title">ComfyUI 配置</div>

                <div class="rainy-field">
                    <label class="rainy-field-label">ComfyUI 地址</label>
                    <input class="rainy-input" type="text" id="rainy-set-comfy-url" 
                           placeholder="http://127.0.0.1:8188" 
                           value="${settings.comfyui?.url || 'http://127.0.0.1:8188'}"></div>

                <div class="rainy-input-row" style="margin-bottom:12px;">
                    <div class="rainy-field">
                        <label class="rainy-field-label">正向提示词节点 ID</label>
                        <input class="rainy-input" type="text" id="rainy-set-comfy-pos-node" 
                               value="${settings.comfyui?.positive_node_id || '6'}">
                    </div>
                    <div class="rainy-field">
                        <label class="rainy-field-label">负向提示词节点 ID</label>
                        <input class="rainy-input" type="text" id="rainy-set-comfy-neg-node" 
                               value="${settings.comfyui?.negative_node_id || '7'}">
                    </div>
                </div>

                <div class="rainy-field">
                    <label class="rainy-field-label">Workflow JSON</label>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button class="rainy-btn rainy-btn-secondary rainy-btn-sm" id="rainy-set-comfy-upload">
                            📂 上传 Workflow
                        </button>
                        <span class="rainy-field-hint" id="rainy-set-comfy-workflow-status">
                            ${settings.comfyui?.workflow ? '✅ 已加载' : '未加载'}
                        </span>
                    </div><input type="file" id="rainy-set-comfy-file" accept=".json" style="display:none;">
                </div>
            </div>

            <!-- 画廊前缀 -->
            <div class="rainy-settings-section">
                <div class="rainy-settings-section-title">画廊设置</div>

                <div class="rainy-field">
                    <label class="rainy-field-label">画师串前缀</label>
                    <textarea class="rainy-textarea" id="rainy-set-gallery-prefix" rows="2"
                              placeholder="masterpiece, best quality">${settings.gallery?.prefix || ''}</textarea>
                    <div class="rainy-field-hint">生成图片时自动添加到提示词前面</div>
                </div>
            </div>

            <!-- 小剧场设置 -->
            <div class="rainy-settings-section">
                <div class="rainy-settings-section-title">小剧场设置</div>

                <div id="rainy-set-theater-types">
                    ${(settings.theater?.types || DEFAULT_SETTINGS.theater.types).map((t, i) => `
                        <div class="rainy-card" data-type-index="${i}">
                            <div class="rainy-input-row" style="margin-bottom:8px;">
                                <div class="rainy-field">
                                    <label class="rainy-field-label">类型名称</label>
                                    <input class="rainy-input rainy-theater-type-name" type="text" value="${t.name}">
                                </div>
                                <button class="rainy-btn rainy-btn-secondary rainy-btn-sm rainy-theater-type-delete" 
                                        style="color:#ef4444; align-self:flex-end;">✕</button>
                            </div>
                            <div class="rainy-field" style="margin-bottom:0;">
                                <label class="rainy-field-label">提示词</label>
                                <textarea class="rainy-textarea rainy-theater-type-prompt" rows="2">${t.prompt}</textarea>
                            </div>
                        </div>
                    `).join('')}
                </div><button class="rainy-btn rainy-btn-secondary rainy-btn-sm" id="rainy-set-theater-add-type" style="margin-top:8px;">
                    ＋ 添加类型
                </button>
            </div>

            <!-- 摘要设置 -->
            <div class="rainy-settings-section">
                <div class="rainy-settings-section-title">摘要站设置</div>

                <div class="rainy-field">
                    <label class="rainy-field-label">QR 名称</label>
                    <input class="rainy-input" type="text" id="rainy-set-qr-name" 
                           placeholder="总结" 
                           value="${settings.summary?.qr_name || '总结'}">
                    <div class="rainy-field-hint">点击"发送总结指令"时触发的 Quick Reply名称</div>
                </div>
            </div>

            <!-- 保存按钮 -->
            <div style="padding:8px 0 20px;">
                <button class="rainy-btn rainy-btn-primary" id="rainy-set-save" style="width:100%;">
                    💾 保存所有设置
                </button>
            </div>
        `;

        // ──绑定设置页面事件 ──

        // 滑块实时显示数值
        const maxTokensSlider = container.querySelector('#rainy-set-max-tokens');
        const maxTokensVal = container.querySelector('#rainy-set-max-tokens-val');
        maxTokensSlider.addEventListener('input', () => {
            maxTokensVal.textContent = maxTokensSlider.value;
        });

        const tempSlider = container.querySelector('#rainy-set-temperature');
        const tempVal = container.querySelector('#rainy-set-temperature-val');
        tempSlider.addEventListener('input', () => {
            tempVal.textContent = tempSlider.value;
        });

        // 获取模型列表
        container.querySelector('#rainy-set-fetch-models').addEventListener('click', async () => {
            const url = container.querySelector('#rainy-set-api-url').value.trim();
            const key = container.querySelector('#rainy-set-api-key').value.trim();
            const modelSelect = container.querySelector('#rainy-set-api-model');
            const hint = container.querySelector('#rainy-set-model-hint');

            if (!url) {
                showToast('请先填写 API 地址', 'error');
                return;
            }

            hint.textContent = '正在获取...';
            hint.style.color = 'var(--rainy-accent)';

            try {
                const models = await fetchModelList(url, key);
                modelSelect.innerHTML = models.map(m =>
                    `<option value="${m}">${m}</option>`
                ).join('');

                // 如果之前有选过的模型，尝试恢复选择
                const prevModel = settings.sub_api?.model;
                if (prevModel && models.includes(prevModel)) {
                    modelSelect.value = prevModel;
                }

                hint.textContent = `✅ 获取到 ${models.length} 个模型`;
                hint.style.color = '#22c55e';
                showToast(`获取到 ${models.length} 个模型`, 'success');
            } catch (e) {
                hint.textContent = `❌ ${e.message}`;
                hint.style.color = '#ef4444';

                // Fallback：允许手动输入
                modelSelect.innerHTML = '<option value="">获取失败，请手动输入</option>';
                const manualInput = document.createElement('input');
                manualInput.className = 'rainy-input';
                manualInput.type = 'text';
                manualInput.placeholder = '手动输入模型名称';
                manualInput.id = 'rainy-set-api-model-manual';
                manualInput.value = settings.sub_api?.model || '';
                manualInput.style.marginTop = '6px';

                const existingManual = container.querySelector('#rainy-set-api-model-manual');
                if (existingManual) existingManual.remove();
                modelSelect.parentElement.parentElement.appendChild(manualInput);

                showToast('获取模型列表失败，可手动输入', 'error');
            }
        });

        // ComfyUI Workflow 上传
        const comfyUploadBtn = container.querySelector('#rainy-set-comfy-upload');
        const comfyFileInput = container.querySelector('#rainy-set-comfy-file');
        const comfyStatus = container.querySelector('#rainy-set-comfy-workflow-status');

        comfyUploadBtn.addEventListener('click', () => comfyFileInput.click());
        comfyFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const workflow = JSON.parse(ev.target.result);
                    // 临时存到 data 属性，保存时再写入 settings
                    comfyUploadBtn.dataset.workflow = ev.target.result;
                    comfyStatus.textContent = `✅ 已加载: ${file.name}`;
                    showToast('Workflow 已加载', 'success');
                } catch {
                    comfyStatus.textContent = '❌ JSON 解析失败';
                    showToast('Workflow JSON 格式错误', 'error');
                }
            };
            reader.readAsText(file);
        });

        // 添加小剧场类型
        container.querySelector('#rainy-set-theater-add-type').addEventListener('click', () => {
            const typesContainer = container.querySelector('#rainy-set-theater-types');
            const index = typesContainer.children.length;
            const newCard = document.createElement('div');
            newCard.className = 'rainy-card';
            newCard.dataset.typeIndex = index;
            newCard.innerHTML = `
                <div class="rainy-input-row" style="margin-bottom:8px;">
                    <div class="rainy-field">
                        <label class="rainy-field-label">类型名称</label>
                        <input class="rainy-input rainy-theater-type-name" type="text" value="新类型">
                    </div>
                    <button class="rainy-btn rainy-btn-secondary rainy-btn-sm rainy-theater-type-delete" 
                            style="color:#ef4444; align-self:flex-end;">✕</button>
                </div>
                <div class="rainy-field" style="margin-bottom:0;">
                    <label class="rainy-field-label">提示词</label>
                    <textarea class="rainy-textarea rainy-theater-type-prompt" rows="2">请输入提示词...</textarea>
                </div>
            `;
            typesContainer.appendChild(newCard);

            // 绑定删除
            newCard.querySelector('.rainy-theater-type-delete').addEventListener('click', () => {
                newCard.remove();
            });
        });

        // 绑定已有的删除按钮
        container.querySelectorAll('.rainy-theater-type-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.rainy-card').remove();
            });
        });

        // 保存所有设置
        container.querySelector('#rainy-set-save').addEventListener('click', () => {
            // 收集小剧场类型
            const typeCards = container.querySelectorAll('#rainy-set-theater-types .rainy-card');
            const types = Array.from(typeCards).map(card => ({
                id: card.querySelector('.rainy-theater-type-name').value.trim().toLowerCase().replace(/\s+/g, '_') || crypto.randomUUID(),
                name: card.querySelector('.rainy-theater-type-name').value.trim(),
                prompt: card.querySelector('.rainy-theater-type-prompt').value.trim(),})).filter(t => t.name && t.prompt);

            // 获取模型值（优先下拉栏，fallback 手动输入）
            let modelValue = container.querySelector('#rainy-set-api-model').value;
            const manualInput = container.querySelector('#rainy-set-api-model-manual');
            if ((!modelValue || modelValue === '') && manualInput) {
                modelValue = manualInput.value.trim();
            }

            // 获取 workflow
            let workflow = settings.comfyui?.workflow || null;
            const workflowData = container.querySelector('#rainy-set-comfy-upload').dataset.workflow;
            if (workflowData) {
                try { workflow = JSON.parse(workflowData); } catch { }
            }

            const newSettings = {
                sub_api: {
                    url: container.querySelector('#rainy-set-api-url').value.trim(),
                    key: container.querySelector('#rainy-set-api-key').value.trim(),
                    model: modelValue,
                    max_tokens: parseInt(container.querySelector('#rainy-set-max-tokens').value),
                    temperature: parseFloat(container.querySelector('#rainy-set-temperature').value),
                },
                nai: {
                    key: container.querySelector('#rainy-set-nai-key').value.trim(),
                    model: container.querySelector('#rainy-set-nai-model').value,
                    sampler: settings.nai?.sampler || 'k_euler_ancestral',
                    steps: parseInt(container.querySelector('#rainy-set-nai-steps').value),
                    cfg_scale: parseFloat(container.querySelector('#rainy-set-nai-cfg').value),
                    width: parseInt(container.querySelector('#rainy-set-nai-width').value),
                    height: parseInt(container.querySelector('#rainy-set-nai-height').value),
                    negative_prompt: container.querySelector('#rainy-set-nai-negative').value.trim(),
                },
                comfyui: {
                    url: container.querySelector('#rainy-set-comfy-url').value.trim(),
                    workflow: workflow,
                    positive_node_id: container.querySelector('#rainy-set-comfy-pos-node').value.trim(),
                    negative_node_id: container.querySelector('#rainy-set-comfy-neg-node').value.trim(),
                },
                gallery: {
                    prefix: container.querySelector('#rainy-set-gallery-prefix').value.trim(),
                },
                theater: {
                    types: types,
                },
                summary: {
                    qr_name: container.querySelector('#rainy-set-qr-name').value.trim() || '总结',
                },fab_position: getSettings().fab_position, // 保留悬浮球位置
            };

            saveSettings(newSettings);
            updateStatusBar(currentApiStatus);
            EventBus.emit(RainyEvents.SETTINGS_CHANGED, newSettings);

            // 如果小剧场已初始化，刷新类型按钮
            if (initializedChannels.has('theater')) {
                initializedChannels.delete('theater');
                const theaterContainer = document.getElementById('rainy-page-theater');
                if (theaterContainer) initTheaterPage(theaterContainer);
            }

            showToast('设置已保存 ✓', 'success');
        });
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 15: 手机端 vh 修正
    // ═══════════════════════════════════════

    function fixMobileVH() {
        function setVH() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--rainy-vh', `${vh}px`);
        }
        setVH();
        window.addEventListener('resize', setVH);
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 16: 插件入口
    // ═══════════════════════════════════════

    function init() {
        console.log('[RainyPlayer] 🌧️ 雨季播放器初始化中...');

        // 修正手机端 vh
        fixMobileVH();

        // 创建悬浮球
        const fab = createFAB();
        document.body.appendChild(fab);

        // 恢复悬浮球位置
        restoreFABPosition(fab);

        // 悬浮球拖拽
        makeDraggable(fab);

        // 创建主面板
        panelEl = createMainPanel();
        document.body.appendChild(panelEl);

        // 初始化状态栏
        updateStatusBar('idle');

        // 监听 ST 事件（如果可用）
        try {
            if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
                const context = SillyTavern.getContext();
                //聊天切换时刷新摘要
                if (context.eventSource) {
                    const CHAT_CHANGED = context.eventTypes?.CHAT_CHANGED || 'chatLoaded';
                    context.eventSource.on(CHAT_CHANGED, () => {
                        if (initializedChannels.has('summary')) {
                            initializedChannels.delete('summary');
                            const summaryContainer = document.getElementById('rainy-page-summary');
                            if (summaryContainer) initSummaryPage(summaryContainer);
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('[RainyPlayer] ST 事件监听设置失败:', e);
        }

        console.log('[RainyPlayer] 🌧️ 初始化完成！');
    }

    // ── 启动 ──
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // jQuery ready兼容
        if (typeof jQuery !== 'undefined') {
            jQuery(init);
        } else {
            init();
        }
    }

})();
