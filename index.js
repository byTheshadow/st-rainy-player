// ═══════════════════════════════════════════════════════════════
// 🌧️ 雨季播放器 (Rainy Player) v0.2.0
// SillyTavern Extension · 拟物化 MP3 播放器
// ═══════════════════════════════════════════════════════════════

(function () {
    'use strict';

    // ═══════════════════════════════════════
    // 📦SECTION 1: 常量& 配置
    // ═══════════════════════════════════════

const PLUGIN_NAME = 'rainy-player';

const CHANNELS = [
    { id: 'theater',   label: '剧场' },
    { id: 'radio',     label: '电台' },
    { id: 'summary',  label: '摘要' },
    { id: 'gallery',   label: '画廊' },
    { id: 'settings',  label: '设置' },
];



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
            negative_prompt: 'lowres, bad anatomy, bad hands, text, error',
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
                
    { id: 'backstage', name: '后台茶水间', prompt: '生成一个非正典的短场景，让多个NPC讨论关于角色和用户的最新主线剧情。用于提供外部视角、展现流言蜚语，并丰富世界观。即时反应：对话必须是针对最新发生的主线事件的直接反应，并展现出NPC们（如敬畏、恐惧、怀疑、困惑等）的不同立场。人设一致：参与对话的每个NPC，其语气和观点都必须严格符合其既定性格。篇幅控制：长度约为100-200字。' },
    { id: 'improv_stage', name: '即兴舞台', prompt: '基于当前主线场景的情感核心（如“紧张对峙”、“笨拙关怀”），创作一个充满创意的、非正典的AU（平行宇宙）短剧。主题再创：必须提炼当前场景的核心主题，并构思一个全新的、意想不到的平行场景来映射该主题。人设保留：无论新场景多么离奇，角色的核心性格必须被完整保留。戏剧性来源于其真实性格与荒诞情境的碰撞。' },
    { id: 'animation_au', name: '动画世界', prompt: '随机生成一个非正典的AU穿越短篇，将角色和用户置于一个经典的动画电影世界（如迪士尼、皮克斯、梦工厂等）的背景中进行互动。' },
    { id: 'deep_au', name: '深度AU长篇', prompt: '生成一个随机的、深度展开的、字数不少于1000字的AU（平行宇宙）短篇故事。火花风暴：第一重从丰富题材库（如赛博朋克、哨兵向导、规则怪谈、末日生存、无限流等）中随机选择一个核心题材；第二重根据选定题材生成具体的开场情境或核心冲突；第三重构思一个独特的文字排版美学和纯文本格式主题。深度叙事：必须包含完整的微型叙事结构（开端->发展->高潮->结局），并深入探索角色和用户在该AU背景下的情感关系和内心挣扎。OOC禁令：无论AU世界多么光怪陆离，角色和用户的核心性格、思维模式和内在驱动力必须保持一致。' },
    { id: 'encore_channel', name: '安可频道', prompt: '随机选择一种独特的、非传统的剧场形式，生成一个充满创意的非正典短篇。核心原则：从各种电视频道、综艺、纪录片、访谈、电台（如国家地理、焦点访谈、动物世界、深夜电台等）中随机选择一种。剧场的内容可以与刚刚结束的正典剧情的核心事件、情绪或主题相关联，也可以完全是AU不与正典剧情相关。形式即内容：必须严格遵循所选频道的独特文字排版格式和节目“人设”来进行叙事。' },
    { id: 'picture_book', name: '治愈绘本', prompt: '将当前复杂的剧情、纠葛的关系或沉重的情感，重构为一本温暖、治愈或带有寓言性质的儿童绘本。童真降维：强制将角色和用户转化为动物、植物或具象化的物体；语言必须极度简单、短促、富有韵律感，模仿睡前故事；将现实中的复杂矛盾转化为童话式困境。绘本结构：必须包含3-5个“页面”，每一页先通过[画面：...]或emoji排版描述视觉构图，然后是对应的绘本配文。情感内核：结局必须是温暖的、和解的，或者如《小王子》般温柔静谧的遗憾。' },
    { id: 'astrology_card', name: '星象运势', prompt: '生成一份基于当前角色星座的、带有神秘学美感的运势卡片，并附加角色的即时反应。星象计算：确认角色星座（若未知则基于性格反推），随机生成今日星象相位（如水星逆行等）。运势解读：包含“宜”（2个具体行动）、“忌”（2个具体行动），以及一句晦涩但似乎在影射当前剧情的预言作为运势短评。角色反馈：描写角色看到这份运势时的反应（是迷信照做、不屑一顾还是若有所思等），反应必须严格符合其人设。' },
    { id: 'personality_test', name: '人格测试', prompt: '随机生成一份人格或身份测试问卷，模拟角色的填写过程与反应。试卷选择：随机选择一种测试（如MBTI、霍格沃兹分院、DND阵营、依恋人格等）。填写过程：生成3-4道该测试的典型题目，并描写角色的作答过程（如认真勾选或在旁边的毒舌吐槽）。结果与锐评：展示最终测试结果，并重点描写角色对结果或某道题目的最终评价（是嗤之以鼻、被戳中痛脚还是觉得有点准），互动必须生动且符合角色性格。' },
    { id: 'social_media_pov', name: '路人视角', prompt: '生成一条由路人或NPC发布的社交媒体动态，从第三方视角侧写刚才的主线剧情。视角选择：随机（如路人随手拍、工作人员群聊、店员树洞等）。创作核心：动态内容必须精准反映刚才角色与用户互动的余波、张力或特定瞬间；需包含一段虚拟照片的纯文本构图描述（如模糊的背影、昏暗灯光下的重叠人影等）；模拟真实的互动数据（点赞、转发数）以及2-3条具有代表性的路人评论（惊叹、八卦或揣测）。角色留存：若情境允许，简短描写角色无意间看到此动态时的一个微小反应（如指尖停顿、冷漠关掉屏幕等）。' },
    { id: 'soul_interview', name: '灵魂拷问', prompt: '生成一段非正典的“灵魂拷问”采访小剧场。场景设定：角色突然置身于一个神秘的采访间，面前的虚拟采访者会针对刚刚主线剧情中角色对用户的真实想法，提出3个非常犀利、甚至有些直白八卦的问题。互动刻画：必须生动描写角色听到问题时的微表情、肢体语言以及最终的回答（是坦诚、傲娇逃避、还是恼怒拍桌）。回答与反应必须绝对符合角色的既定人设与当下的心理隐秘状态。' },
    { id: 'item_drop', name: '掉落图鉴', prompt: '将刚才主线剧情的情感核心或某个细节，转化为一个RPG游戏中的“掉落物品”图鉴。物品名称：基于当前剧情提取（如“未能说出口的抱歉”、“被揉乱的衣角”）。物品稀有度：随机分配（普通到传说）。物品描述：用一段充满游戏色彩又带点细腻情感的文字，描述此物品的来历和触感。装备效果：设定奇妙的加成（如“当用户佩戴时，角色的理智值下降10%”）。评语：最后附带一句角色的专属吐槽或内心独白作为图鉴底部的收藏家寄语。' },
    { id: 'blooper_reel', name: '片场NG花絮', prompt: '打破第四面墙，将刚才的主线剧情当作是在拍摄一部剧集，生成一段非正典的“片场NG花絮”。情境设定：刚才剧情中最紧张、最感人或最暧昧的那个瞬间，因为某个意外（如角色嘴瓢忘词、道具突然掉落、用户忍不住笑场或场外噪音等）而突然NG导演喊卡。脱戏反应：生动描写角色瞬间从剧情状态中抽离出来的真实反应（是无奈扶额、被逗笑、还是认真地要求保一条），展现角色和用户在“演员”身份下轻松有趣的互动氛围。' },
    { id: 'dream_diary', name: '梦境解码', prompt: '基于刚才的主线事件生成一段荒诞且隐喻丰富的“角色梦境记录”。情境设定：事件结束后，角色进入了睡眠，做了一个光怪陆离的梦。梦境内容：梦里必须出现用户，但用户的形象或所处的环境发生了扭曲的超现实变化（例如两人在失重的海洋里喝茶，或用户变成了难以触碰的玻璃人）。情感投射：梦境必须精准投射出角色在刚才剧情中未能表达出的潜意识（如占有欲、恐惧、愧疚或极度的渴望）。结尾：以角色突然惊醒，看着现实环境的怔愣与心有余悸作为收尾。' }

            ],
        },
        summary: {
            qr_name: '总结',
            qr_command: '/trigger qr="总结"',
            reminder_threshold: 50,
        },
        worldbook: {
            default_depth: 4,
            default_position: 4,   // ST position枚举: 0=before_char, 4=after_char
            default_keyword: 'rainy_summary',
            last_used_book: '',// 记住上次选择的世界书
        },

        
        custom_qr: [
            // { id: 'uuid', name: '总结', command: '/trigger qr="总结"' },
        ],
        fab_position: { x: null, y: null },
        show_fab: true,
        fab_position: { x: null, y: null },
show_fab: true,
theme: 'default',

    };
      
    function uuid() {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
    } catch {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
}
const THEMES = {
    default: {
        name: '清透白蓝',
    },
    mono: {
        name: '黑白极简',
    },
};

function applyTheme(themeName) {
    const theme = THEMES[themeName] ? themeName : 'default';
    document.documentElement.setAttribute('data-theme', theme);
    storage.set('theme', theme);
}




    // ═══════════════════════════════════════
    // 📦 SECTION 2: Storage
    // ═══════════════════════════════════════

    const PREFIX = 'rainy_';

    const storage = {
        get(key, defaultVal = null) {
            try {
                const raw = localStorage.getItem(PREFIX + key);
                return raw ? JSON.parse(raw) : defaultVal;
            } catch { return defaultVal; }
        },
        set(key, val) {
            try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); }
            catch (e) { console.error('[RainyPlayer] Storage error:', e); }
        },
        update(key, defaultVal, updater) {
            const current = this.get(key, defaultVal);
            const updated = updater(current);
            this.set(key, updated);
            return updated;
        },
        remove(key) { localStorage.removeItem(PREFIX + key); },
    };

    function deepMerge(target, source) {
        const result = { ...target };
        for (const key of Object.keys(source)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(target[key] || {}, source[key]);
            } else if (source[key] !== undefined) {
                result[key] = source[key];
            }
        }
        return result;
    }

    function getSettings() {
        const saved = storage.get('settings', {});
        return deepMerge(DEFAULT_SETTINGS, saved);
    }

    function saveSettings(settings) { storage.set('settings', settings); }

    function updateSettings(updater) {
        const s = getSettings();
        const updated = updater(s);
        saveSettings(updated);
        return updated;
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 3: 事件总线
    // ═══════════════════════════════════════

    const EventBus = {
        _l: {},
        on(e, cb) { (this._l[e] ??= []).push(cb); },
        off(e, cb) { if (this._l[e]) this._l[e] = this._l[e].filter(c => c !== cb); },
        emit(e, ...a) { this._l[e]?.forEach(cb => { try { cb(...a); } catch (err) { console.error('[RainyPlayer]', err); } }); },
    };

    const RE = { // Rainy Events
        SETTINGS_CHANGED: 'settings_changed',
        API_STATUS: 'api_status',
        CHANNEL_CHANGED: 'channel_changed',};
            function renderMarkdown(text) {
        if (!text) return '';
        let html = escapeHtml(text);

        // 代码块 ``````
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="rainy-md-codeblock"><code>$2</code></pre>');

        // 行内代码 `...`
        html = html.replace(/`([^`]+)`/g, '<code class="rainy-md-code">$1</code>');

        // 标题 ### / ## / #
        html = html.replace(/^### (.+)$/gm, '<h4 class="rainy-md-h4">$1</h4>');
        html = html.replace(/^## (.+)$/gm, '<h3 class="rainy-md-h3">$1</h3>');
        html = html.replace(/^# (.+)$/gm, '<h2 class="rainy-md-h2">$1</h2>');

        //粗体 **...**
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // 斜体 *...*
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // 删除线 ~~...~~
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // 无序列表 - item
        html = html.replace(/^[-*] (.+)$/gm, '<li class="rainy-md-li">$1</li>');
        html = html.replace(/((?:<li class="rainy-md-li">.*<\/li>\n?)+)/g, '<ul class="rainy-md-ul">$1</ul>');

        // 有序列表 1. item
        html = html.replace(/^\d+\. (.+)$/gm, '<li class="rainy-md-oli">$1</li>');
        html = html.replace(/((?:<li class="rainy-md-oli">.*<\/li>\n?)+)/g, '<ol class="rainy-md-ol">$1</ol>');

        // 引用 >
        html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="rainy-md-quote">$1</blockquote>');

        // 水平线 ---
        html = html.replace(/^---$/gm, '<hr class="rainy-md-hr">');

        // 换行：连续两个换行 → 段落，单个换行 → <br>
        html = html.replace(/\n\n/g, '</p><p class="rainy-md-p">');
        html = html.replace(/\n/g, '<br>');

        // 包裹在段落中
        html = '<p class="rainy-md-p">' + html + '</p>';

        // 清理空段落
        html = html.replace(/<p class="rainy-md-p"><\/p>/g, '');
        html = html.replace(/<p class="rainy-md-p">(<h[234])/g, '$1');
        html = html.replace(/(<\/h[234]>)<\/p>/g, '$1');
        html = html.replace(/<p class="rainy-md-p">(<ul|<ol|<blockquote|<pre|<hr)/g, '$1');
        html = html.replace(/(<\/ul>|<\/ol>|<\/blockquote>|<\/pre>)<\/p>/g, '$1');

        return html;
    }


    // ═══════════════════════════════════════
    // 📦 SECTION 4: 副API
    // ═══════════════════════════════════════

    async function fetchModelList(url, key) {
        if (!url) throw new Error('请先填写 API地址');
        let base = url.replace(/\/+$/, '');
        if (!base.endsWith('/v1')) base += '/v1';
        const resp = await fetch(`${base}/models`, {
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.data && Array.isArray(data.data)) return data.data.map(m => m.id);
        throw new Error('返回格式不正确');
    }

    async function subApiGenerate({ ordered_prompts, max_chat_history = 20 }) {
              const s = getSettings().sub_api;
        if (!s.url || !s.model) throw new Error('请先在设置中配置副 API');

        setApiStatus('generating');

        try {
            // 构建 messages 数组
            const messages = [];

            // 从 ST 获取上下文信息（角色描述、聊天历史等）
            let charDescription = '';
            let charPersonality = '';
            let chatHistory = [];
            let worldInfoBefore = '';
            let worldInfoAfter = '';

            try {
                if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
                    const ctx = SillyTavern.getContext();

                    // 获取角色信息
                    if (ctx.characters && ctx.characterId !== undefined) {
                        const char = ctx.characters[ctx.characterId];
                        if (char) {
                            charDescription = char.description || '';
                            charPersonality = char.personality || '';}
                    }

                    // 获取聊天历史
                    if (ctx.chat && Array.isArray(ctx.chat)) {
                        const recentChat = ctx.chat.slice(-max_chat_history);
                        chatHistory = recentChat.map(msg => ({
                            role: msg.is_user ? 'user' : 'assistant',
                            content: msg.mes || msg.message || '',
                        })).filter(m => m.content.trim());
                    }
                }
            } catch (e) {
                console.warn('[RainyPlayer] 获取 ST 上下文失败，将仅使用 prompt:', e);
            }

            // 按 ordered_prompts 顺序构建 messages
            for (const item of ordered_prompts) {
                if (typeof item === 'string') {
                    // 字符串标识符：引用 ST 上下文数据
                    switch (item) {
                        case 'char_description':
                            if (charDescription) {
                                messages.push({ role: 'system', content: `[角色描述]\n${charDescription}` });
                            }
                            break;
                        case 'char_personality':
                            if (charPersonality) {
                                messages.push({ role: 'system', content: `[角色性格]\n${charPersonality}` });
                            }
                            break;
                        case 'chat_history':
                            messages.push(...chatHistory);
                            break;
                        case 'world_info_before':
                            if (worldInfoBefore) {
                                messages.push({ role: 'system', content: worldInfoBefore });
                            }
                            break;
                        case 'world_info_after':
                            if (worldInfoAfter) {
                                messages.push({ role: 'system', content: worldInfoAfter });
                            }
                            break;
                        default:
                            console.warn('[RainyPlayer] 未知的 prompt 标识符:', item);
                    }
                } else if (item && typeof item === 'object' && item.role && item.content) {
                    // 直接的 message 对象
                    messages.push({ role: item.role, content: item.content });
                }
            }

            // 确保至少有一条消息
            if (messages.length === 0) {
                messages.push({ role: 'user', content: '请生成内容。' });
            }

            // 直接 fetch 调用 OpenAI 兼容 API
            let base = s.url.replace(/\/+$/, '');
            if (!base.endsWith('/v1')) base += '/v1';

            console.log('[RainyPlayer] 调用副API:', base, '模型:', s.model, '消息数:', messages.length);

            const resp = await fetch(`${base}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${s.key}`,
                },
                body: JSON.stringify({
                    model: s.model,
                    messages: messages,
                    max_tokens: s.max_tokens || 2000,
                    temperature: s.temperature ?? 0.9,
                    stream: false,
                }),
            });

            if (!resp.ok) {
                const errText = await resp.text().catch(() => '');
                console.error('[RainyPlayer] API 错误响应:', resp.status, errText);
                throw new Error(`API 错误${resp.status}: ${errText.slice(0, 200)}`);
            }

            const data = await resp.json();

            // 提取回复内容
            const reply = data.choices?.[0]?.message?.content;
            if (!reply) {
                console.error('[RainyPlayer] API 返回格式异常:', data);
                throw new Error('API 返回格式异常，无法提取回复');
            }

            console.log('[RainyPlayer] 生成成功，长度:', reply.length);
            setApiStatus('connected');
            return reply;

        } catch (e) {
            setApiStatus('error');
            throw e;
        }
    }

    let apiStatus = 'idle';
    function setApiStatus(s) {
        apiStatus = s;
        EventBus.emit(RE.API_STATUS, s);
        updateStatusBarUI(s);
        updateLedUI(s);
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 5: Toast
    // ═══════════════════════════════════════

    let toastBox = null;
    function showToast(msg, type = 'info', dur = 3000) {
        if (!toastBox) {
            toastBox = document.createElement('div');
            toastBox.className = 'rainy-toast-container';
            document.body.appendChild(toastBox);
        }
        const t = document.createElement('div');
        t.className = `rainy-toast is-${type}`;
        t.textContent = msg;
        toastBox.appendChild(t);
        setTimeout(() => { t.classList.add('is-hiding'); setTimeout(() => t.remove(), 300); }, dur);
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 6:悬浮球
    // ═══════════════════════════════════════

    function createFAB() {
        const fab = document.createElement('button');
        fab.className = 'rainy-fab';
        fab.id = 'rainy-fab';
        fab.title = '雨季播放器';
        fab.innerHTML = `
            <div class="rainy-fab-inner">
                <svg viewBox="0 0 24 24"><path d="M12 3v10.55A44 0 1 0 14 17V7h4V3h-6z" fill="currentColor"/></svg>
            </div>
        `;
        return fab;
    }

    function makeDraggable(fab) {
        let dragging = false, startX, startY, startL, startT, moved;

        function onStart(e) {
            const p = e.touches ? e.touches[0] : e;
            startX = p.clientX; startY = p.clientY;
            const r = fab.getBoundingClientRect();
            startL = r.left; startT = r.top;
            moved = false; dragging = true;
            fab.classList.add('is-dragging');if (e.touches) e.preventDefault();
        }

        function onMove(e) {
            if (!dragging) return;
            const p = e.touches ? e.touches[0] : e;
            const dx = p.clientX - startX, dy = p.clientY - startY;
            if (Math.abs(dx) >=5 || Math.abs(dy) >= 5) moved = true;
            if (moved) {
                const sz = fab.offsetWidth;
                const nl = Math.max(0, Math.min(startL + dx, window.innerWidth - sz));
                const nt = Math.max(0, Math.min(startT + dy, window.innerHeight - sz));
                fab.style.right = 'auto'; fab.style.bottom = 'auto';
                fab.style.left = nl + 'px'; fab.style.top = nt + 'px';
                if (e.touches) e.preventDefault();
            }
        }

        function onEnd() {
            if (!dragging) return;
            dragging = false;
            fab.classList.remove('is-dragging');
            if (moved) {
                const r = fab.getBoundingClientRect();
                updateSettings(s => { s.fab_position = { x: r.left, y: r.top }; return s; });
            } else {
                togglePanel();
            }
        }

        fab.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        fab.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }

    function restoreFABPosition(fab) {
        const pos = getSettings().fab_position;
        if (pos?.x != null && pos?.y != null) {
            fab.style.right = 'auto'; fab.style.bottom = 'auto';
            fab.style.left = pos.x + 'px'; fab.style.top = pos.y + 'px';
        }
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 7: 主面板（MP3 外壳）
    // ═══════════════════════════════════════

    let panelEl = null;
    let isPanelOpen = false;
    let currentChannel = 'theater';

    function createMainPanel() {
        const panel = document.createElement('div');
        panel.className = 'rainy-panel';
        panel.id = 'rainy-panel';

        // 生成扬声器孔
        const speakerDots = Array(12).fill('<span class="rainy-mp3-speaker-dot"></span>').join('');

        panel.innerHTML = `
            <!-- MP3 顶部：品牌 + LED + 扬声器 -->
            <div class="rainy-mp3-top">
                <div class="rainy-mp3-brand">
                    <span class="rainy-mp3-led" id="rainy-led"></span>
                    <span class="rainy-mp3-logo">Rainy Player</span>
                </div>
                <div class="rainy-mp3-speaker">${speakerDots}</div>
                <button class="rainy-mp3-close" id="rainy-close" title="关闭">✕</button>
            </div>

            <!-- 屏幕（凹陷） -->
            <div class="rainy-mp3-screen-wrap">
                <div class="rainy-mp3-screen">
                    <!--屏幕顶部信息 -->
                    <div class="rainy-screen-header">
                        <span class="rainy-screen-title" id="rainy-screen-title">🎬 剧场</span>
                        <div class="rainy-screen-status">
                            <span class="rainy-screen-status-dot" id="rainy-screen-dot"></span>
                            <span id="rainy-screen-status-text">READY</span>
                        </div>
                    </div>

                    <!-- 屏幕内容 -->
                    <div class="rainy-screen-content" id="rainy-screen-content">
                        ${CHANNELS.map(ch => `
                            <div class="rainy-app-page ${ch.id === currentChannel ? 'is-active' : ''}"
                                 data-page="${ch.id}" id="rainy-page-${ch.id}"></div>
                        `).join('')}
                    </div>

                    <!-- 屏幕底部状态 -->
                    <div class="rainy-mp3-statusbar">
                        <span class="rainy-mp3-statusbar-text" id="rainy-statusbar-left">v0.2.0</span>
                        <span class="rainy-mp3-statusbar-model" id="rainy-statusbar-model"></span>
                    </div>
                </div>
            </div>

            <!-- 物理按钮区 -->
            <div class="rainy-mp3-controls">
                <div class="rainy-mp3-tabs">
                    ${CHANNELS.map(ch => `
                        <button class="rainy-mp3-tab ${ch.id === currentChannel ? 'is-active' : ''}"
                                data-channel="${ch.id}" title="${ch.label}">
                            <span class="rainy-mp3-tab-icon">${ch.icon}</span>
                            <span class="rainy-mp3-tab-label">${ch.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // 事件绑定
        panel.querySelector('#rainy-close').addEventListener('click', closePanel);
        panel.querySelectorAll('.rainy-mp3-tab').forEach(tab => {
            tab.addEventListener('click', () => switchChannel(tab.dataset.channel));
        });

        return panel;
    }

    function togglePanel() {
        isPanelOpen ? closePanel() : openPanel();
    }

    function openPanel() {
        if (!panelEl) return;
        isPanelOpen = true;
        panelEl.classList.add('is-open');
        initChannelIfNeeded(currentChannel);
    }

    function closePanel() {
        if (!panelEl) return;
        isPanelOpen = false;
        panelEl.classList.remove('is-open');
    }

    function switchChannel(id) {
        if (id === currentChannel) return;
        currentChannel = id;

        // 更新 Tab
        panelEl.querySelectorAll('.rainy-mp3-tab').forEach(t => {
            t.classList.toggle('is-active', t.dataset.channel === id);
        });

        // 更新页面
        panelEl.querySelectorAll('.rainy-app-page').forEach(p => {
            p.classList.toggle('is-active', p.dataset.page === id);
        });

        // 更新屏幕标题
        const ch = CHANNELS.find(c => c.id === id);
        const titleEl = document.getElementById('rainy-screen-title');
        if (titleEl && ch) titleEl.textContent = `${ch.icon} ${ch.label}`;

        initChannelIfNeeded(id);EventBus.emit(RE.CHANNEL_CHANGED, id);
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 8: 频道初始化管理
    // ═══════════════════════════════════════

    const inited = new Set();

    function initChannelIfNeeded(id) {
        if (inited.has(id)) return;
        inited.add(id);
        const el = document.getElementById(`rainy-page-${id}`);
        if (!el) return;
        const initFns = { theater: initTheater, radio: initRadio, summary: initSummary, gallery: initGallery, settings: initSettings };
        initFns[id]?.(el);
    }

    function reinitChannel(id) {
        inited.delete(id);
        const el = document.getElementById(`rainy-page-${id}`);
        if (el) { el.innerHTML = ''; initChannelIfNeeded(id); }
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 9: LED & 状态栏 UI更新
    // ═══════════════════════════════════════

    function updateLedUI(status) {
        const led = document.getElementById('rainy-led');
        if (!led) return;
        led.classList.remove('is-generating', 'is-error');
        if (status === 'generating') led.classList.add('is-generating');
        else if (status === 'error') led.classList.add('is-error');
    }

    function updateStatusBarUI(status) {
        const dot = document.getElementById('rainy-screen-dot');
        const text = document.getElementById('rainy-screen-status-text');
        const model = document.getElementById('rainy-statusbar-model');
        if (!dot || !text) return;

        dot.classList.remove('is-on');
        const map = { idle: 'READY', connected: 'ONLINE', generating: 'GENERATING...', error: 'ERROR' };
        text.textContent = map[status] || 'READY';
        if (status === 'connected' || status === 'generating') dot.classList.add('is-on');

        if (model) {
            const m = getSettings().sub_api?.model;
            model.textContent = m ? m.split('/').pop() : '';
        }
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 10: 小剧场
    // ═══════════════════════════════════════

    function initTheater(el) {
        const settings = getSettings();
        const types = settings.theater?.types || DEFAULT_SETTINGS.theater.types;

        el.innerHTML = `
            <div class="rainy-theater-types" id="rainy-theater-types">
                ${types.map((t, i) => `
                    <button class="rainy-theater-type-btn ${i === 0 ? 'is-active' : ''}"
                            data-type-id="${t.id}">${t.name}</button>
                `).join('')}
            </div>
            <div class="rainy-theater-output" id="rainy-theater-output">
                <div class="rainy-scr-empty">
                    <div class="rainy-scr-empty-icon">🎬</div>
                    <div class="rainy-scr-empty-text">选择类型，点击生成<br>开始番外小剧场</div>
                </div>
            </div>
            <div class="rainy-theater-actions">
                <button class="rainy-scr-btn is-primary" id="rainy-theater-gen">▶ 生成</button>
                <button class="rainy-scr-btn" id="rainy-theater-reroll" disabled>🔄 重Roll</button>
                <button class="rainy-scr-btn rainy-scr-btn-sm" id="rainy-theater-export" disabled>📤 导出</button>
            </div><div class="rainy-scr-divider"></div>
            <div style="font-size:10px; color:var(--rainy-screen-text-dim); margin-bottom:6px;">📜 历史记录</div>
            <div id="rainy-theater-history"></div>
        `;

        let selectedTypeId = types[0]?.id;

        el.querySelectorAll('.rainy-theater-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                el.querySelectorAll('.rainy-theater-type-btn').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                selectedTypeId = btn.dataset.typeId;
            });
        });

        el.querySelector('#rainy-theater-gen').addEventListener('click', async () => {
            const type = types.find(t => t.id === selectedTypeId);
            if (!type) return;
            const out = el.querySelector('#rainy-theater-output');
            const genBtn = el.querySelector('#rainy-theater-gen');
            const rerollBtn = el.querySelector('#rainy-theater-reroll');
            const exportBtn = el.querySelector('#rainy-theater-export');

            genBtn.disabled = true;
            out.innerHTML = '<div class="rainy-scr-loading"><div class="rainy-scr-loading-dot"></div><div class="rainy-scr-loading-dot"></div><div class="rainy-scr-loading-dot"></div></div>';

            try {
                const result = await subApiGenerate({
                    ordered_prompts: [
                        'char_description', 'char_personality', 'chat_history',
                        { role: 'system', content: type.prompt },
                        { role: 'user', content: '请生成小剧场。' },
                    ],
                    max_chat_history: 20,
                });
                out.innerHTML = renderMarkdown(result);
                rerollBtn.disabled = false;
                exportBtn.disabled = false;

                storage.update('theater_history', [], list => {
                    list.unshift({ id: uuid(), type_id: type.id, type_name: type.name, content: result, created_at: Date.now(), starred: false });
                    return list.slice(0, 50);
                });
                refreshTheaterHistory(el);
            } catch (e) {
                out.innerHTML = `<div class="rainy-scr-empty"><div class="rainy-scr-empty-text" style="color:#ef4444;">生成失败: ${e.message}</div></div>`;
                showToast('生成失败: ' + e.message, 'error');
            } finally { genBtn.disabled = false; }
        });

        el.querySelector('#rainy-theater-reroll').addEventListener('click', () => el.querySelector('#rainy-theater-gen').click());

        el.querySelector('#rainy-theater-export').addEventListener('click', () => {
            const content = el.querySelector('#rainy-theater-output').textContent;
            if (!content) return;
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `小剧场_${new Date().toLocaleDateString()}.txt`;
            a.click();
            URL.revokeObjectURL(a.href);
            showToast('已导出', 'success');
        });

        refreshTheaterHistory(el);
    }
function refreshTheaterHistory(el) {
    const box = el.querySelector('#rainy-theater-history');
    const history = storage.get('theater_history', []);

    if (!history.length) {
        box.innerHTML = '<div class="rainy-scr-empty"><div class="rainy-scr-empty-text" style="font-size:11px;">暂无记录</div></div>';
        return;
    }

    box.innerHTML = history.slice(0, 10).map(item => `
        <div class="rainy-scr-card ${item.starred ? 'is-starred' : ''}" style="cursor:pointer;" data-hid="${item.id}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:3px;">
                <div style="display:flex; gap:6px; align-items:center; min-width:0;">
                    <span style="font-size:10px; color:var(--rainy-screen-accent); font-weight:600;">${item.type_name}</span>
                    ${item.starred ? '<span style="font-size:10px;">⭐</span>' : ''}
                </div>
                <div style="display:flex; gap:6px; flex-shrink:0;">
                    <button class="rainy-mini-icon-btn" data-action="star" title="收藏/取消收藏">⭐</button>
                    <button class="rainy-mini-icon-btn" data-action="delete" title="删除">🗑</button>
                </div>
            </div>
            <div style="font-size:9px; color:var(--rainy-screen-text-dim); margin-bottom:4px;">${new Date(item.created_at).toLocaleString()}</div>
            <div style="font-size:11px; color:var(--rainy-screen-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(item.content.substring(0, 50))}${item.content.length > 50 ? '...' : ''}</div>
        </div>
    `).join('');

    box.querySelectorAll('.rainy-scr-card').forEach(card => {
        const item = history.find(h => h.id === card.dataset.hid);
        if (!item) return;

        card.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('button[data-action]');
            if (actionBtn) return;

            el.querySelector('#rainy-theater-output').innerHTML = renderMarkdown(item.content);
            el.querySelector('#rainy-theater-export').disabled = false;
            el.querySelector('#rainy-theater-reroll').disabled = false;
        });

        card.querySelector('[data-action="star"]').addEventListener('click', (e) => {
            e.stopPropagation();
            storage.update('theater_history', [], list => {
                return list.map(h => h.id === item.id ? { ...h, starred: !h.starred } : h);
            });
            refreshTheaterHistory(el);
        });

        card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm('确定删除这条小剧场历史吗？')) return;
            storage.update('theater_history', [], list => list.filter(h => h.id !== item.id));
            refreshTheaterHistory(el);
        });
    });
}

    // ═══════════════════════════════════════
    // 📦 SECTION 11: 世界电台
    // ═══════════════════════════════════════

    function initRadio(el) {
        el.innerHTML = `
            <div class="rainy-radio-marquee-wrap">
                <div class="rainy-radio-marquee" id="rainy-radio-marquee">
                    ▸ WORLD RADIO ▸点击调频接收广播 ▸ STANDBY ▸▸▸
                </div>
            </div>
            <div id="rainy-radio-news">
                <div class="rainy-scr-empty">
                    <div class="rainy-scr-empty-icon">📻</div>
                    <div class="rainy-scr-empty-text">点击「调频」按钮<br>接收来自这个世界的新闻</div>
                </div>
            </div>
            <div style="margin-top:12px;">
                <button class="rainy-scr-btn is-primary" id="rainy-radio-tune" style="width:100%;">📡 调频</button>
            </div>
            <div class="rainy-scr-divider"></div>
            <div style="font-size:10px; color:var(--rainy-screen-text-dim); margin-bottom:6px;">📜 广播历史</div>
            <div id="rainy-radio-history"></div>
        `;

        el.querySelector('#rainy-radio-tune').addEventListener('click', async () => {
            const newsEl = el.querySelector('#rainy-radio-news');
            const btn = el.querySelector('#rainy-radio-tune');
            const marquee = el.querySelector('#rainy-radio-marquee');

            btn.disabled = true;
            marquee.textContent = '▸▸▸ RECEIVING SIGNAL ▸▸▸';
            newsEl.innerHTML = '<div class="rainy-scr-loading"><div class="rainy-scr-loading-dot"></div><div class="rainy-scr-loading-dot"></div><div class="rainy-scr-loading-dot"></div></div>';

            try {
                const result = await subApiGenerate({
                    ordered_prompts: [
                        'world_info_before', 'char_description', 'world_info_after',
                        { role: 'system', content: '你是这个世界中的广播电台主播。基于世界观设定，用生动的播报风格播报3条世界新闻。每条新闻用【标题】和正文的格式。' },
                        { role: 'user', content: '开始播报。' },
                    ],
                    max_chat_history: 10,
                });

                const items = parseRadioNews(result);
                                newsEl.innerHTML = items.map(item => `
                    <div class="rainy-radio-news-card">
                        <div class="rainy-radio-news-title">${escapeHtml(item.title)}</div>
                        <div class="rainy-radio-news-body">${renderMarkdown(item.body)}</div>
                    </div>
                `).join('');


                marquee.textContent = `▸ ${items.length} NEWS RECEIVED ▸ ${new Date().toLocaleTimeString()} ▸▸▸`;

                storage.update('radio_history', [], list => {
                    list.unshift({ id: uuid(), content: result, created_at: Date.now() });
                    return list.slice(0, 20);
                });
refreshRadioHistory(el);

            } catch (e) {
                newsEl.innerHTML = `<div class="rainy-scr-empty"><div class="rainy-scr-empty-text" style="color:#ef4444;">接收失败: ${e.message}</div></div>`;
                marquee.textContent = '▸▸▸ SIGNAL LOST ▸▸▸';
                showToast('电台接收失败', 'error');
            } finally { btn.disabled = false; }
        });
        refreshRadioHistory(el);

    }

   function parseRadioNews(text) {
    const regex = /【(.+?)】([\s\S]*?)(?=【|$)/g;
    const items = [];
    let m;
    while ((m = regex.exec(text)) !== null) {
        items.push({ title: m[1].trim(), body: m[2].trim() });
    }
    if (!items.length) items.push({ title: '广播速报', body: text });
    return items;
}

function refreshRadioHistory(el) {
    const box = el.querySelector('#rainy-radio-history');
    const history = storage.get('radio_history', []);

    if (!history.length) {
        box.innerHTML = '<div class="rainy-scr-empty"><div class="rainy-scr-empty-text" style="font-size:11px;">暂无记录</div></div>';
        return;
    }

    box.innerHTML = history.slice(0, 10).map(item => `
        <div class="rainy-scr-card" style="cursor:pointer;" data-hid="${item.id}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:3px;">
                <span style="font-size:10px; color:var(--rainy-screen-accent); font-weight:600;">广播记录</span>
                <button class="rainy-mini-icon-btn" data-action="delete" title="删除">🗑</button>
            </div>
            <div style="font-size:9px; color:var(--rainy-screen-text-dim); margin-bottom:4px;">${new Date(item.created_at).toLocaleString()}</div>
            <div style="font-size:11px; color:var(--rainy-screen-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(item.content.substring(0, 50))}${item.content.length > 50 ? '...' : ''}</div>
        </div>
    `).join('');

    box.querySelectorAll('.rainy-scr-card').forEach(card => {
        const item = history.find(h => h.id === card.dataset.hid);
        if (!item) return;

        card.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('button[data-action]');
            if (actionBtn) return;

            const newsEl = el.querySelector('#rainy-radio-news');
            const items = parseRadioNews(item.content);
            newsEl.innerHTML = items.map(n => `
                <div class="rainy-radio-news-card">
                    <div class="rainy-radio-news-title">${escapeHtml(n.title)}</div>
                    <div class="rainy-radio-news-body">${renderMarkdown(n.body)}</div>
                </div>
            `).join('');
        });

        card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm('确定删除这条广播历史吗？')) return;
            storage.update('radio_history', [], list => list.filter(h => h.id !== item.id));
            refreshRadioHistory(el);
        });
    });
}

    // ═══════════════════════════════════════
    // 📦 SECTION 12: 摘要站（多条+ 翻页+ 提醒 + QR）
    // ═══════════════════════════════════════

    function initSummary(el) {
        const settings = getSettings();
        const customQRs = settings.custom_qr || [];

        el.innerHTML = `
            <!-- 总结提醒 -->
            <div class="rainy-summary-reminder" id="rainy-summary-reminder" style="display:none;">
                <span class="rainy-summary-reminder-icon">⚠️</span>
                <span id="rainy-summary-reminder-text">聊天已超过50楼，建议进行总结</span>
            </div>

            <!-- 导航 -->
            <div class="rainy-summary-nav">
                <div class="rainy-summary-nav-btns">
                    <button class="rainy-scr-btn rainy-scr-btn-sm" id="rainy-summary-prev" disabled>◀</button>
                    <button class="rainy-scr-btn rainy-scr-btn-sm" id="rainy-summary-next" disabled>▶</button>
                </div>
                <div class="rainy-summary-nav-info" id="rainy-summary-nav-info">-- / --</div>
            </div>

            <!-- 摘要内容 -->
            <div class="rainy-summary-content" id="rainy-summary-content">
                <div class="rainy-scr-empty">
                    <div class="rainy-scr-empty-icon">📋</div>
                    <div class="rainy-scr-empty-text">点击「刷新」读取摘要</div>
                </div>
            </div>

                       <!-- 操作按钮 -->
            <div class="rainy-summary-actions">
                <button class="rainy-scr-btn is-primary" id="rainy-summary-refresh">🔄 刷新摘要</button>
                <button class="rainy-scr-btn" id="rainy-summary-trigger">📝 发送总结指令</button><button class="rainy-scr-btn" id="rainy-summary-to-wb">📖 写入世界书</button>
            </div>

            <!-- 写入世界书弹出面板（默认隐藏） -->
            <div class="rainy-wb-overlay" id="rainy-wb-overlay" style="display:none;">
                <div class="rainy-wb-panel">
                    <div class="rainy-wb-panel-header">
                        <span>📖 写入世界书</span>
                        <button class="rainy-wb-panel-close" id="rainy-wb-close">✕</button>
                    </div>
                    <div class="rainy-wb-panel-body">
                        <div class="rainy-scr-field">
                            <label class="rainy-scr-label">目标世界书</label>
                            <div class="rainy-scr-row">
                                <div class="rainy-scr-field" style="margin-bottom:0;">
                                    <select class="rainy-scr-select" id="rainy-wb-book-select">
                                        <option value="">点击右侧刷新获取列表</option>
                                    </select>
                                </div>
                                <button class="rainy-scr-btn rainy-scr-btn-sm" id="rainy-wb-refresh-books">🔄</button>
                            </div><div class="rainy-scr-hint" id="rainy-wb-book-hint"></div>
                        </div>

                        <div class="rainy-scr-field">
                            <label class="rainy-scr-label">关键词 (Key)</label>
                            <input class="rainy-scr-input" type="text" id="rainy-wb-keyword" placeholder="rainy_summary">
                            <div class="rainy-scr-hint">世界书条目的触发关键词，多个用逗号分隔</div>
                        </div>

                        <div class="rainy-scr-row">
                            <div class="rainy-scr-field">
                                <label class="rainy-scr-label">深度 (Depth)</label>
                                <input class="rainy-scr-input" type="number" id="rainy-wb-depth" value="4" min="0" max="999"></div>
                            <div class="rainy-scr-field">
                                <label class="rainy-scr-label">位置 (Position)</label>
                                <select class="rainy-scr-select" id="rainy-wb-position">
                                    <option value="0">Before Char Defs</option>
                                    <option value="4" selected>After Char Defs</option>
                                <option value="1">Before AN (Top)</option>
                                    <option value="2">After AN (Bottom)</option>
                                    <option value="3">At Depth</option>
                                </select>
                            </div>
                        </div>

                        <div class="rainy-scr-field">
                            <label class="rainy-scr-label">内容</label>
                            <textarea class="rainy-scr-textarea" id="rainy-wb-content" rows="6" placeholder="将写入世界书的文本..."></textarea>
                        </div>
                    </div>
                    <div class="rainy-wb-panel-footer">
                        <button class="rainy-scr-btn" id="rainy-wb-cancel">取消</button>
                        <button class="rainy-scr-btn is-primary" id="rainy-wb-confirm">✅ 确认写入</button>
                    </div>
                </div>
            </div>


            <div class="rainy-scr-divider"></div>

            <!-- QR 快捷指令 -->
            <div class="rainy-qr-section">
                <div style="font-size:10px; color:var(--rainy-screen-text-dim); margin-bottom:6px;">⚡ 快捷指令</div>
                <div class="rainy-qr-btns" id="rainy-qr-btns">
                    ${customQRs.map(qr => `
                        <button class="rainy-qr-btn" data-qr-cmd="${escapeHtml(qr.command)}" title="${escapeHtml(qr.command)}">${escapeHtml(qr.name)}</button>
                    `).join('')}
                    ${customQRs.length === 0 ? '<span style="font-size:10px; color:var(--rainy-screen-text-dim);">在设置中添加快捷指令</span>' : ''}
                </div>
            </div>
        `;

        // 摘要数据
        let allSummaries = [];
        let currentIndex = 0;

        function renderSummary() {
            const contentEl = el.querySelector('#rainy-summary-content');
            const navInfo = el.querySelector('#rainy-summary-nav-info');
            const prevBtn = el.querySelector('#rainy-summary-prev');
            const nextBtn = el.querySelector('#rainy-summary-next');

            if (allSummaries.length === 0) {
                contentEl.innerHTML = '<div class="rainy-scr-empty"><div class="rainy-scr-empty-text">未找到 &lt;meow_FM&gt; 标签内容</div></div>';
                navInfo.textContent = '0 / 0';
                prevBtn.disabled = true;
                nextBtn.disabled = true;
                return;
            }

            const item = allSummaries[currentIndex];
            contentEl.innerHTML = `
                <div class="rainy-summary-meta">楼层 #${item.msgIndex + 1} · ${item.role === 'assistant' ? '🤖 AI' : '👤 User'} · ${new Date(item.timestamp || Date.now()).toLocaleString()}</div>
                <div>${item.content}</div>
            `;

            navInfo.textContent = `${currentIndex + 1} / ${allSummaries.length}`;
            prevBtn.disabled = currentIndex <= 0;
            nextBtn.disabled = currentIndex >= allSummaries.length - 1;
        }

        //刷新
        el.querySelector('#rainy-summary-refresh').addEventListener('click', () => {
            try {
                if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) throw new Error('ST 环境不可用');
                const ctx = SillyTavern.getContext();
                const chat = ctx.chat;
                if (!chat || chat.length === 0) {
                    allSummaries = [];
                    renderSummary();
                    return;
                }

                // 提取所有 <meow_FM> 标签
                allSummaries = [];
                for (let i = 0; i < chat.length; i++) {
                    const msg = chat[i];
                    const content = msg.mes || msg.message || '';
                    const match = content.match(/<meow_FM>([\s\S]*?)<\/meow_FM>/);
                    if (match) {
                        allSummaries.push({
                            msgIndex: i,
                            role: msg.is_user ? 'user' : 'assistant',
                            content: match[1].trim(),
                            timestamp: msg.send_date ? new Date(msg.send_date).getTime() : null,
                        });
                    }
                }

                // 默认显示最新的（最后一条）
                currentIndex = Math.max(0, allSummaries.length - 1);
                renderSummary();// 检查楼层数提醒
                const threshold = getSettings().summary?.reminder_threshold || 50;
                const reminderEl = el.querySelector('#rainy-summary-reminder');
                const reminderText = el.querySelector('#rainy-summary-reminder-text');

                if (allSummaries.length > 0) {
                    const lastSummaryFloor = allSummaries[allSummaries.length - 1].msgIndex;
                    const messagesSinceLast = chat.length - 1 - lastSummaryFloor;
                    if (messagesSinceLast >= threshold) {
                        reminderEl.style.display = 'flex';
                        reminderText.textContent = `距上次总结已过 ${messagesSinceLast} 楼（阈值 ${threshold}），建议总结`;
                    } else {
                        reminderEl.style.display = 'none';
                    }
                } else if (chat.length >= threshold) {
                    reminderEl.style.display = 'flex';
                    reminderText.textContent = `聊天已达 ${chat.length} 楼，尚无总结记录，建议总结`;
                } else {
                    reminderEl.style.display = 'none';
                }

                if (allSummaries.length > 0) {
                    showToast(`找到 ${allSummaries.length} 条摘要`, 'success');
                } else {
                    showToast('未找到 meow_FM 标签', 'info');
                }
            } catch (e) {
                showToast('读取失败: ' + e.message, 'error');
            }
        });

        // 翻页
        el.querySelector('#rainy-summary-prev').addEventListener('click', () => {
            if (currentIndex > 0) { currentIndex--; renderSummary(); }
        });
        el.querySelector('#rainy-summary-next').addEventListener('click', () => {
            if (currentIndex < allSummaries.length - 1) { currentIndex++; renderSummary(); }
        });

        // 发送总结指令
        el.querySelector('#rainy-summary-trigger').addEventListener('click', async () => {
            try {
                const settings = getSettings();
                const cmd = settings.summary?.qr_command || '/trigger qr="总结"';
                if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) throw new Error('ST 环境不可用');
                const ctx = SillyTavern.getContext();
                await ctx.executeSlashCommands(cmd);
                showToast('已发送总结指令', 'success');
            } catch (e) {
                showToast('指令失败: ' + e.message, 'error');
            }
        });

        // QR 快捷按钮
        el.querySelectorAll('.rainy-qr-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    const cmd = btn.dataset.qrCmd;
                    if (!cmd) return;
                    if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) throw new Error('ST 环境不可用');
                    const ctx = SillyTavern.getContext();
                    await ctx.executeSlashCommands(cmd);
                    showToast(`已执行: ${btn.textContent}`, 'success');
                } catch (e) {
                    showToast('执行失败: ' + e.message, 'error');
                }
            });
        });
                // ── 写入世界书 ──

        const wbOverlay = el.querySelector('#rainy-wb-overlay');
        const wbBookSelect = el.querySelector('#rainy-wb-book-select');
        const wbKeyword = el.querySelector('#rainy-wb-keyword');
        const wbDepth = el.querySelector('#rainy-wb-depth');
        const wbPosition = el.querySelector('#rainy-wb-position');
        const wbContent = el.querySelector('#rainy-wb-content');
        const wbBookHint = el.querySelector('#rainy-wb-book-hint');

        // 用默认设置填充
        const wbDefaults = getSettings().worldbook || {};
        wbKeyword.value = wbDefaults.default_keyword || 'rainy_summary';
        wbDepth.value = wbDefaults.default_depth ?? 4;
        wbPosition.value = String(wbDefaults.default_position ?? 4);

        // 打开写入世界书面板
        el.querySelector('#rainy-summary-to-wb').addEventListener('click', () => {
            // 填入当前显示的摘要内容
            if (allSummaries.length > 0) {
                const item = allSummaries[currentIndex];
                wbContent.value = item.content;} else {
                wbContent.value = '';
            }
            //恢复上次选择的世界书
            if (wbDefaults.last_used_book && wbBookSelect.querySelector(`option[value="${CSS.escape(wbDefaults.last_used_book)}"]`)) {
                wbBookSelect.value = wbDefaults.last_used_book;
            }
            wbOverlay.style.display = 'flex';
        });

        // 关闭
        el.querySelector('#rainy-wb-close').addEventListener('click', () => { wbOverlay.style.display = 'none'; });
        el.querySelector('#rainy-wb-cancel').addEventListener('click', () => { wbOverlay.style.display = 'none'; });

        // 点击 overlay 背景关闭
        wbOverlay.addEventListener('click', (e) => {
            if (e.target === wbOverlay) wbOverlay.style.display = 'none';
        });

        // 刷新世界书列表
        el.querySelector('#rainy-wb-refresh-books').addEventListener('click', async () => {
            await refreshWorldBookList();
        });

        async function refreshWorldBookList() {
            wbBookHint.textContent = '获取中...';
            wbBookHint.style.color = 'var(--rainy-screen-accent)';

            try {
                if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) throw new Error('ST 环境不可用');
                const ctx = SillyTavern.getContext();

                const books = new Set();

                // 获取全局世界书
                try {
                    const globalResult = await ctx.executeSlashCommandsWithOptions('/getglobalwi', { handleParserErrors: false, handleExecutionErrors: false });
                    const globalPipe = globalResult?.pipe;
                    if (globalPipe && typeof globalPipe === 'string' && globalPipe.trim()) {
                        globalPipe.split(',').map(s => s.trim()).filter(Boolean).forEach(b => books.add(b));
                    }
                } catch (e) { console.warn('[RainyPlayer] getglobalwi failed:', e); }

                // 获取角色绑定世界书
                try {
                    const charResult = await ctx.executeSlashCommandsWithOptions('/getcharwi', { handleParserErrors: false, handleExecutionErrors: false });
                    const charPipe = charResult?.pipe;
                    if (charPipe && typeof charPipe === 'string' && charPipe.trim()) {
                        charPipe.split(',').map(s => s.trim()).filter(Boolean).forEach(b => books.add(b));
                    }
                } catch (e) { console.warn('[RainyPlayer] getcharwi failed:', e); }

                // 获取聊天绑定世界书
                try {
                    const chatResult = await ctx.executeSlashCommandsWithOptions('/getchatwi', { handleParserErrors: false, handleExecutionErrors: false });
                    const chatPipe = chatResult?.pipe;
                    if (chatPipe && typeof chatPipe === 'string' && chatPipe.trim()) {
                        chatPipe.split(',').map(s => s.trim()).filter(Boolean).forEach(b => books.add(b));
                    }
                } catch (e) { console.warn('[RainyPlayer] getchatwi failed:', e); }

                // 获取 persona 绑定世界书
                try {
                    const personaResult = await ctx.executeSlashCommandsWithOptions('/getpersonawi', { handleParserErrors: false, handleExecutionErrors: false });
                    const personaPipe = personaResult?.pipe;
                    if (personaPipe && typeof personaPipe === 'string' && personaPipe.trim()) {
                        personaPipe.split(',').map(s => s.trim()).filter(Boolean).forEach(b => books.add(b));
                    }
                } catch (e) { console.warn('[RainyPlayer] getpersonawi failed:', e); }

                if (books.size === 0) {
                    wbBookSelect.innerHTML = '<option value="">未找到已激活的世界书</option>';
                    wbBookHint.textContent = '⚠️ 请确保至少激活了一个世界书';
                    wbBookHint.style.color = '#ca8a04';
                    return;
                }

                const bookArray = [...books];
                wbBookSelect.innerHTML = bookArray.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');

                // 恢复上次选择
                if (wbDefaults.last_used_book && bookArray.includes(wbDefaults.last_used_book)) {
                    wbBookSelect.value = wbDefaults.last_used_book;
                }

                wbBookHint.textContent = `✅ 找到 ${bookArray.length} 个世界书`;
                wbBookHint.style.color = '#22c55e';
                showToast(`找到 ${bookArray.length} 个世界书`, 'success');

            } catch (e) {
                wbBookHint.textContent = `❌ ${e.message}`;
                wbBookHint.style.color = '#ef4444';
                showToast('获取世界书列表失败: ' + e.message, 'error');
            }
        }

        // 确认写入
        el.querySelector('#rainy-wb-confirm').addEventListener('click', async () => {
            const bookName = wbBookSelect.value.trim();
            const keyword = wbKeyword.value.trim();
            const depth = parseInt(wbDepth.value) || 4;
            const position = parseInt(wbPosition.value) || 4;
            const content = wbContent.value.trim();

            if (!bookName) { showToast('请先选择目标世界书', 'error'); return; }
            if (!keyword) { showToast('请填写关键词', 'error'); return; }
            if (!content) { showToast('内容不能为空', 'error'); return; }

            const confirmBtn = el.querySelector('#rainy-wb-confirm');
            confirmBtn.disabled = true;
            confirmBtn.textContent = '⏳ 写入中...';
try {
                if (typeof SillyTavern === 'undefined' || !SillyTavern.getContext) throw new Error('ST环境不可用');
                const ctx = SillyTavern.getContext();

                // 步骤1: 创建条目
                const safeBook = bookName.replace(/"/g, '\\"');
                const safeKey = keyword.replace(/"/g, '\\"');

                const createResult = await ctx.executeSlashCommandsWithOptions(
                    `/createwi file="${safeBook}" key="${safeKey}"`,
                    { handleParserErrors: false, handleExecutionErrors: false }
                );

                const uid = String(createResult?.pipe ?? '').trim();
                console.log('[RainyPlayer] 世界书条目已创建, UID:', uid);

                if (uid === '' || uid === 'undefined' || uid === 'null') {
                    throw new Error('创建条目失败：未返回有效 UID');
                }

                // 步骤2: 设置 content
                const safeContent = content.replace(/`/g, '\\`');
                try {
                    await ctx.executeSlashCommandsWithOptions(
                        `/setvar key=_rainy_temp ${safeContent}`,
                        { handleParserErrors: false, handleExecutionErrors: false }
                    );
                    await ctx.executeSlashCommandsWithOptions(
                        `/setwifield file="${safeBook}" uid=${uid} field=content {{getvar::_rainy_temp}}`,
                        { handleParserErrors: false, handleExecutionErrors: false }
                    );
                    console.log('[RainyPlayer] content 设置成功');
                } catch (e) {
                    console.warn('[RainyPlayer] 变量方式失败,尝试直接写入:', e);
                    try {
                        const escapedContent = content.replace(/\|/g, '\\|').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
                        await ctx.executeSlashCommandsWithOptions(
                            `/setwifield file="${safeBook}" uid=${uid} field=content ${escapedContent}`,
                            { handleParserErrors: false, handleExecutionErrors: false }
                        );
                    } catch (e2) { console.error('[RainyPlayer] 直接写入也失败:', e2); }
                }

                // 步骤3: 设置 depth / position / disable / constant
                try {
                    await ctx.executeSlashCommandsWithOptions(
                        `/setwifield file="${safeBook}" uid=${uid} field=depth ${depth}`,
                        { handleParserErrors: false, handleExecutionErrors: false }
                    );
                } catch (e) { console.warn('[RainyPlayer] depth:', e); }

                try {
                    await ctx.executeSlashCommandsWithOptions(
                        `/setwifield file="${safeBook}" uid=${uid} field=position ${position}`,
                        { handleParserErrors: false, handleExecutionErrors: false }
                    );
                } catch (e) { console.warn('[RainyPlayer] position:', e); }

                try {
                    await ctx.executeSlashCommandsWithOptions(
                        `/setwifield file="${safeBook}" uid=${uid} field=disable false`,
                        { handleParserErrors: false, handleExecutionErrors: false }
                    );
                } catch (e) { console.warn('[RainyPlayer] disable:', e); }

                try {
                    await ctx.executeSlashCommandsWithOptions(
                        `/setwifield file="${safeBook}" uid=${uid} field=constant true`,
                        { handleParserErrors: false, handleExecutionErrors: false }
                    );
                } catch (e) { console.warn('[RainyPlayer] constant:', e); }

                // 清理临时变量
                try {
                    await ctx.executeSlashCommandsWithOptions(`/setvar key=_rainy_temp`, { handleParserErrors: false, handleExecutionErrors: false });
                } catch (e) { /* 忽略 */ }

                // 记住上次使用的世界书
                updateSettings(s => {
                    if (!s.worldbook) s.worldbook = {};
                    s.worldbook.last_used_book = bookName;
                    return s;
                });

                // 先关闭弹窗，再延迟显示成功提示
                wbOverlay.style.display = 'none';
                setTimeout(() => {
                    showToast('✅ 写入成功！世界书「' + bookName + '」·UID:' + uid, 'success', 4000);
                }, 200);

            } catch (e) {
                console.error('[RainyPlayer] 写入世界书失败:', e);
                wbOverlay.style.display = 'none';
                setTimeout(() => {
                    showToast('❌ 写入失败: ' + e.message, 'error', 5000);
                }, 200);
                // Fallback: 复制到剪贴板
                try {
                    await navigator.clipboard.writeText(content);
                    setTimeout(() => {
                        showToast('📋 已复制内容到剪贴板，请手动粘贴', 'warning', 5000);
                    }, 1500);
                } catch { /* 剪贴板也失败 */ }
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.textContent = '✅ 确认写入';
            }
        });   // addEventListener 闭合
                

    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 13: 画廊（占位）
    // ═══════════════════════════════════════

    function initGallery(el) {
        el.innerHTML = `
            <div class="rainy-scr-empty">
                <div class="rainy-scr-empty-icon">🎨</div>
                <div class="rainy-scr-empty-text">画廊功能将在后续版本实现<br><span style="font-size:10px;">支持 NAI / ComfyUI 生图</span></div>
            </div>
        `;
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 14: 设置页面
    // ═══════════════════════════════════════

    function initSettings(el) {
        const s = getSettings();

        el.innerHTML = `
            <!--── 副API ── -->
            <div class="rainy-settings-section">
                <div class="rainy-scr-section-title">副 API 配置</div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">API 地址</label>
                    <input class="rainy-scr-input" type="text" id="rs-api-url" placeholder="https://api.example.com/v1" value="${s.sub_api?.url || ''}">
                </div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">API Key</label>
                    <input class="rainy-scr-input" type="password" id="rs-api-key" placeholder="sk-..." value="${s.sub_api?.key || ''}">
                </div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">模型</label>
                    <div class="rainy-scr-row">
                        <div class="rainy-scr-field" style="margin-bottom:0;">
                            <select class="rainy-scr-select" id="rs-api-model">
                                ${s.sub_api?.model ? `<option value="${s.sub_api.model}" selected>${s.sub_api.model}</option>` : '<option value="">请先获取模型列表</option>'}
                            </select>
                        </div>
                        <button class="rainy-scr-btn rainy-scr-btn-sm" id="rs-fetch-models">获取</button>
                    </div><div class="rainy-scr-hint" id="rs-model-hint"></div>
                </div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">Max Tokens</label>
                    <div class="rainy-scr-slider-row">
                        <input type="range" id="rs-max-tokens" min="256" max="8192" step="256" value="${s.sub_api?.max_tokens || 2000}">
                        <span class="rainy-scr-slider-val" id="rs-max-tokens-v">${s.sub_api?.max_tokens || 2000}</span>
                    </div></div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">Temperature</label>
                    <div class="rainy-scr-slider-row">
                        <input type="range" id="rs-temp" min="0" max="2" step="0.1" value="${s.sub_api?.temperature || 0.9}">
                        <span class="rainy-scr-slider-val" id="rs-temp-v">${s.sub_api?.temperature || 0.9}</span>
                    </div>
                </div>
            </div>

            <!-- ── NAI ── -->
            <div class="rainy-settings-section">
                <div class="rainy-scr-section-title">NAI 绘图配置</div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">NAI API Key</label>
                    <input class="rainy-scr-input" type="password" id="rs-nai-key" placeholder="pst-..." value="${s.nai?.key || ''}">
                </div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">模型</label>
                    <select class="rainy-scr-select" id="rs-nai-model">
                        <option value="nai-diffusion-4-5" ${s.nai?.model === 'nai-diffusion-4-5' ? 'selected' : ''}>V4.5</option>
                        <option value="nai-diffusion-4" ${s.nai?.model === 'nai-diffusion-4' ? 'selected' : ''}>V4</option>
                        <option value="nai-diffusion-3" ${s.nai?.model === 'nai-diffusion-3' ? 'selected' : ''}>V3</option>
                    </select>
                </div>

                <div class="rainy-scr-row">
                    <div class="rainy-scr-field">
                        <label class="rainy-scr-label">宽度</label>
                        <input class="rainy-scr-input" type="number" id="rs-nai-w" value="${s.nai?.width || 832}" step="64">
                    </div>
                    <div class="rainy-scr-field">
                        <label class="rainy-scr-label">高度</label>
                        <input class="rainy-scr-input" type="number" id="rs-nai-h" value="${s.nai?.height || 1216}" step="64">
                    </div>
                </div>

                <div class="rainy-scr-row">
                    <div class="rainy-scr-field">
                        <label class="rainy-scr-label">Steps</label>
                        <input class="rainy-scr-input" type="number" id="rs-nai-steps" value="${s.nai?.steps || 28}" min="1" max="50">
                    </div>
                    <div class="rainy-scr-field">
                        <label class="rainy-scr-label">CFG</label>
                        <input class="rainy-scr-input" type="number" id="rs-nai-cfg" value="${s.nai?.cfg_scale || 5}" min="1" max="30" step="0.5">
                    </div>
                </div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">负面提示词</label>
                    <textarea class="rainy-scr-textarea" id="rs-nai-neg" rows="2">${s.nai?.negative_prompt || ''}</textarea>
                </div>
            </div>

            <!-- ── ComfyUI ── -->
            <div class="rainy-settings-section">
                <div class="rainy-scr-section-title">ComfyUI 配置</div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">ComfyUI 地址</label>
                    <input class="rainy-scr-input" type="text" id="rs-comfy-url" placeholder="http://127.0.0.1:8188" value="${s.comfyui?.url || 'http://127.0.0.1:8188'}">
                </div>

                <div class="rainy-scr-row">
                    <div class="rainy-scr-field">
                        <label class="rainy-scr-label">正向节点 ID</label>
                        <input class="rainy-scr-input" type="text" id="rs-comfy-pos" value="${s.comfyui?.positive_node_id || '6'}">
                    </div>
                    <div class="rainy-scr-field">
                        <label class="rainy-scr-label">负向节点 ID</label>
                        <input class="rainy-scr-input" type="text" id="rs-comfy-neg" value="${s.comfyui?.negative_node_id || '7'}">
                    </div>
                </div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">Workflow</label>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button class="rainy-scr-btn rainy-scr-btn-sm" id="rs-comfy-upload">📂 上传</button>
                        <span class="rainy-scr-hint" id="rs-comfy-status">${s.comfyui?.workflow ? '✅ 已加载' : '未加载'}</span>
                    </div>
                    <input type="file" id="rs-comfy-file" accept=".json" style="display:none;">
                </div>
            </div>

            <!-- ── 画廊前缀 ── -->
            <div class="rainy-settings-section">
                <div class="rainy-scr-section-title">画廊设置</div>
                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">画师串前缀</label>
                    <textarea class="rainy-scr-textarea" id="rs-gallery-prefix" rows="2" placeholder="masterpiece, best quality">${s.gallery?.prefix || ''}</textarea>
                </div>
            </div>

            <!-- ── 小剧场类型 ── -->
            <div class="rainy-settings-section">
                <div class="rainy-scr-section-title">小剧场类型</div>
                <div id="rs-theater-types">
                    ${(s.theater?.types || DEFAULT_SETTINGS.theater.types).map((t, i) => theaterTypeCardHTML(t, i)).join('')}
                </div>
                <button class="rainy-scr-btn rainy-scr-btn-sm" id="rs-theater-add" style="margin-top:6px;">＋ 添加类型</button>
            </div>

            <!-- ── 摘要 & 总结指令 ── -->
            <div class="rainy-settings-section">
                <div class="rainy-scr-section-title">摘要站设置</div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">总结指令</label>
                    <input class="rainy-scr-input" type="text" id="rs-summary-cmd" placeholder='/trigger qr="总结"' value="${escapeHtml(s.summary?.qr_command || '/trigger qr="总结"')}"><div class="rainy-scr-hint">点击「发送总结指令」时执行的Slash Command</div>
                </div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">提醒阈值（楼层数）</label>
                    <div class="rainy-scr-slider-row">
                        <input type="range" id="rs-summary-threshold" min="20" max="200" step="10" value="${s.summary?.reminder_threshold || 50}">
                        <span class="rainy-scr-slider-val" id="rs-summary-threshold-v">${s.summary?.reminder_threshold || 50}</span>
                    </div>
                <div class="rainy-scr-hint">距上次总结超过此楼层数时显示提醒</div>
                </div>
            </div>
                        <!-- ── 世界书默认设置 ── -->
            <div class="rainy-settings-section">
                <div class="rainy-scr-section-title">世界书默认设置</div>
                <div class="rainy-scr-hint" style="margin-bottom:8px;">写入世界书时的默认值</div>

                <div class="rainy-scr-field">
                    <label class="rainy-scr-label">默认关键词</label>
                    <input class="rainy-scr-input" type="text" id="rs-wb-keyword" placeholder="rainy_summary" value="${escapeHtml(s.worldbook?.default_keyword ||'rainy_summary')}">
                </div>

                <div class="rainy-scr-row">
                    <div class="rainy-scr-field">
                        <label class="rainy-scr-label">默认深度</label>
                        <input class="rainy-scr-input" type="number" id="rs-wb-depth" value="${s.worldbook?.default_depth ?? 4}" min="0" max="999">
                    </div>
                    <div class="rainy-scr-field">
                        <label class="rainy-scr-label">默认位置</label>
                        <select class="rainy-scr-select" id="rs-wb-position">
                            <option value="0" ${(s.worldbook?.default_position ?? 4) === 0 ? 'selected' : ''}>Before Char Defs</option>
                            <option value="4" ${(s.worldbook?.default_position ?? 4) === 4 ? 'selected' : ''}>After Char Defs</option>
                            <option value="1" ${(s.worldbook?.default_position ?? 4) === 1 ? 'selected' : ''}>Before AN (Top)</option>
                            <option value="2" ${(s.worldbook?.default_position ?? 4) === 2 ? 'selected' : ''}>After AN (Bottom)</option>
                            <option value="3" ${(s.worldbook?.default_position ?? 4) === 3 ? 'selected' : ''}>At Depth</option>
                        </select>
                    </div>
                </div>
            </div>


            <!-- ── 自定义 QR 快捷指令 ── -->
            <div class="rainy-settings-section">
                <div class="rainy-scr-section-title">自定义快捷指令</div>
                <div class="rainy-scr-hint" style="margin-bottom:8px;">添加常用的 Slash Command，将显示在摘要站底部</div>
                <div id="rs-custom-qr">
                    ${(s.custom_qr || []).map((qr, i) => customQRCardHTML(qr, i)).join('')}
                </div>
                <button class="rainy-scr-btn rainy-scr-btn-sm" id="rs-qr-add" style="margin-top:6px;">＋ 添加指令</button>
            </div>
            <div class="rainy-setting-item">
    <label>UI 主题</label>
    <select id="rainy-theme-select" class="rainy-scr-select">
        <option value="default">清透白蓝</option>
        <option value="mono">黑白极简</option>
    </select>
</div>


            <!-- ── 显示设置 ── -->
            <div class="rainy-settings-section">
                <div class="rainy-scr-section-title">显示设置</div>
                <div class="rainy-scr-field">
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="rs-show-fab" ${s.show_fab !== false ? 'checked' : ''}>
                        <span class="rainy-scr-label" style="margin:0;">显示悬浮球</span>
                    </label>
                    <div class="rainy-scr-hint">关闭后可通过扩展面板打开播放器</div>
                </div>
            </div>

            <!-- 保存 -->
            <div style="padding:8px 0 20px;">
                <button class="rainy-scr-btn is-primary" id="rs-save" style="width:100%; padding:10px;">💾 保存所有设置</button>
            </div>
        `;

        // ── 事件绑定 ──
                const themeSelect = el.querySelector('#rainy-theme-select');
        if (themeSelect) {
            themeSelect.value = storage.get('theme', 'default');
            themeSelect.addEventListener('change', (e) => {
                applyTheme(e.target.value);
                showToast('主题已切换', 'success');
            });
        }


        // 滑块
        bindSlider(el, 'rs-max-tokens', 'rs-max-tokens-v');
        bindSlider(el, 'rs-temp', 'rs-temp-v');
        bindSlider(el, 'rs-summary-threshold', 'rs-summary-threshold-v');

        // 获取模型
        el.querySelector('#rs-fetch-models').addEventListener('click', async () => {
            const url = el.querySelector('#rs-api-url').value.trim();
            const key = el.querySelector('#rs-api-key').value.trim();
            const sel = el.querySelector('#rs-api-model');
            const hint = el.querySelector('#rs-model-hint');

            if (!url) { showToast('请先填写 API 地址', 'error'); return; }
            hint.textContent = '获取中...';
            hint.style.color = 'var(--rainy-screen-accent)';

            try {
                const models = await fetchModelList(url, key);
                sel.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
                if (s.sub_api?.model && models.includes(s.sub_api.model)) sel.value = s.sub_api.model;
                hint.textContent = `✅ ${models.length} 个模型`;hint.style.color = '#22c55e';
                showToast(`获取到 ${models.length} 个模型`, 'success');
            } catch (e) {
                hint.textContent = `❌ ${e.message}`;
                hint.style.color = '#ef4444';
                // fallback 手动输入
                sel.innerHTML = '<option value="">获取失败</option>';
                if (!el.querySelector('#rs-api-model-manual')) {
                    const inp = document.createElement('input');
                    inp.className = 'rainy-scr-input';
                    inp.type = 'text';
                    inp.placeholder = '手动输入模型名';
                    inp.id = 'rs-api-model-manual';
                    inp.value = s.sub_api?.model || '';
                    inp.style.marginTop = '4px';
                    sel.parentElement.parentElement.appendChild(inp);
                }
                showToast('获取失败，可手动输入', 'error');
            }
        });

        // ComfyUI workflow上传
        el.querySelector('#rs-comfy-upload').addEventListener('click', () => el.querySelector('#rs-comfy-file').click());
        el.querySelector('#rs-comfy-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    JSON.parse(ev.target.result);
                    el.querySelector('#rs-comfy-upload').dataset.workflow = ev.target.result;
                    el.querySelector('#rs-comfy-status').textContent = `✅ ${file.name}`;
                    showToast('Workflow 已加载', 'success');
                } catch { showToast('JSON 格式错误', 'error'); }
            };
            reader.readAsText(file);
        });

        // 添加小剧场类型
        el.querySelector('#rs-theater-add').addEventListener('click', () => {
            const box = el.querySelector('#rs-theater-types');
            const idx = box.children.length;
            box.insertAdjacentHTML('beforeend', theaterTypeCardHTML({ id: '', name: '新类型', prompt: '' }, idx));
            bindDeleteBtns(box, '.rainy-theater-del');
        });bindDeleteBtns(el.querySelector('#rs-theater-types'), '.rainy-theater-del');

        // 添加自定义 QR
        el.querySelector('#rs-qr-add').addEventListener('click', () => {
            const box = el.querySelector('#rs-custom-qr');
            const idx = box.children.length;
            box.insertAdjacentHTML('beforeend', customQRCardHTML({ id: '', name: '新指令', command: '/trigger qr="名称"' }, idx));
            bindDeleteBtns(box, '.rainy-qr-del');
        });
        bindDeleteBtns(el.querySelector('#rs-custom-qr'), '.rainy-qr-del');

        // 保存
        el.querySelector('#rs-save').addEventListener('click', () => {
            // 收集小剧场类型
            const typeCards = el.querySelectorAll('#rs-theater-types .rainy-scr-card');
            const types = Array.from(typeCards).map(c => ({
                id: c.querySelector('.rt-name').value.trim().toLowerCase().replace(/\s+/g, '_') || uuid(),
                name: c.querySelector('.rt-name').value.trim(),
                prompt: c.querySelector('.rt-prompt').value.trim(),
            })).filter(t => t.name && t.prompt);

            // 收集自定义 QR
            const qrCards = el.querySelectorAll('#rs-custom-qr .rainy-scr-card');
            const customQR = Array.from(qrCards).map(c => ({
                id: uuid(),
                name: c.querySelector('.rq-name').value.trim(),
                command: c.querySelector('.rq-cmd').value.trim(),
            })).filter(q => q.name && q.command);

            // 模型
            let model = el.querySelector('#rs-api-model').value;
            const manual = el.querySelector('#rs-api-model-manual');
            if (!model && manual) model = manual.value.trim();

            // workflow
            let workflow = s.comfyui?.workflow || null;
            const wfData = el.querySelector('#rs-comfy-upload').dataset.workflow;
            if (wfData) { try { workflow = JSON.parse(wfData); } catch {} }

            const newSettings = {
                sub_api: {
                    url: el.querySelector('#rs-api-url').value.trim(),
                    key: el.querySelector('#rs-api-key').value.trim(),
                    model,
                    max_tokens: parseInt(el.querySelector('#rs-max-tokens').value),
                    temperature: parseFloat(el.querySelector('#rs-temp').value),
                },
                nai: {
                    key: el.querySelector('#rs-nai-key').value.trim(),
                    model: el.querySelector('#rs-nai-model').value,
                    sampler: s.nai?.sampler || 'k_euler_ancestral',
                    steps: parseInt(el.querySelector('#rs-nai-steps').value),
                    cfg_scale: parseFloat(el.querySelector('#rs-nai-cfg').value),
                    width: parseInt(el.querySelector('#rs-nai-w').value),
                    height: parseInt(el.querySelector('#rs-nai-h').value),
                    negative_prompt: el.querySelector('#rs-nai-neg').value.trim(),
                },
                comfyui: {
                    url: el.querySelector('#rs-comfy-url').value.trim(),
                    workflow,
                    positive_node_id: el.querySelector('#rs-comfy-pos').value.trim(),
                    negative_node_id: el.querySelector('#rs-comfy-neg').value.trim(),
                },
                gallery: { prefix: el.querySelector('#rs-gallery-prefix').value.trim() },
                theater: { types },
                summary: {
                    qr_name: s.summary?.qr_name || '总结',
                    qr_command: el.querySelector('#rs-summary-cmd').value.trim(),
                    reminder_threshold: parseInt(el.querySelector('#rs-summary-threshold').value),
                },
                 worldbook: {
                    default_keyword: el.querySelector('#rs-wb-keyword').value.trim() || 'rainy_summary',
                    default_depth: parseInt(el.querySelector('#rs-wb-depth').value) || 4,
                    default_position: parseInt(el.querySelector('#rs-wb-position').value) || 4,
                    last_used_book: getSettings().worldbook?.last_used_book || '',
                },

                custom_qr: customQR,
                fab_position: getSettings().fab_position,
                show_fab: el.querySelector('#rs-show-fab').checked,
            };

            saveSettings(newSettings);
            updateStatusBarUI(apiStatus);

            // 更新悬浮球显隐
            const fab = document.getElementById('rainy-fab');
            if (fab) fab.style.display = newSettings.show_fab ? '' : 'none';

            //刷新相关频道
            reinitChannel('theater');
            reinitChannel('summary');

            showToast('设置已保存 ✓', 'success');
            EventBus.emit(RE.SETTINGS_CHANGED, newSettings);
        });
    }

    // 设置页辅助函数
    function theaterTypeCardHTML(t, i) {
        return `
            <div class="rainy-scr-card" data-idx="${i}">
                <div class="rainy-scr-row" style="margin-bottom:6px;">
                    <div class="rainy-scr-field" style="margin-bottom:0;">
                        <input class="rainy-scr-input rt-name" type="text" value="${escapeHtml(t.name)}" placeholder="类型名">
                    </div>
                    <button class="rainy-scr-btn rainy-scr-btn-sm rainy-theater-del" style="color:#ef4444;">✕</button>
                </div>
                <div class="rainy-scr-field" style="margin-bottom:0;">
                    <textarea class="rainy-scr-textarea rt-prompt" rows="2" placeholder="提示词">${escapeHtml(t.prompt)}</textarea>
                </div>
            </div>
        `;
    }

    function customQRCardHTML(qr, i) {
        return `
            <div class="rainy-scr-card" data-idx="${i}">
                <div class="rainy-scr-row" style="margin-bottom:6px;">
                    <div class="rainy-scr-field" style="margin-bottom:0;">
                        <input class="rainy-scr-input rq-name" type="text" value="${escapeHtml(qr.name)}" placeholder="按钮名称">
                    </div>
                    <button class="rainy-scr-btn rainy-scr-btn-sm rainy-qr-del" style="color:#ef4444;">✕</button>
                </div>
                <div class="rainy-scr-field" style="margin-bottom:0;">
                    <input class="rainy-scr-input rq-cmd" type="text" value="${escapeHtml(qr.command)}" placeholder='/trigger qr="名称"'>
                </div>
            </div>
        `;
    }
    

    function bindSlider(el, sliderId, valId) {
        const slider = el.querySelector(`#${sliderId}`);
        const val = el.querySelector(`#${valId}`);
        if (slider && val) slider.addEventListener('input', () => { val.textContent = slider.value; });
    }

    function bindDeleteBtns(container, selector) {
        if (!container) return;
        container.querySelectorAll(selector).forEach(btn => {
            btn.onclick = () => btn.closest('.rainy-scr-card').remove();
        });
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 15: ST扩展面板入口
    // ═══════════════════════════════════════

    function createSTSettingsPanel() {
        // 创建 ST 扩展面板中的设置区域
        const settingsHtml = `
            <div id="rainy-player-st-settings" class="rainy-player-st-settings">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>🌧️ 雨季播放器</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        <button class="rainy-ext-open-btn" id="rainy-ext-open-btn">🎵 打开雨季播放器
                        </button>
                        <div class="rainy-ext-toggle-row">
                            <span class="rainy-ext-toggle-label">显示悬浮球</span>
                            <input type="checkbox" id="rainy-ext-show-fab" ${getSettings().show_fab !== false ? 'checked' : ''}>
                        </div>
                    </div>
                </div></div>
        `;

        // 注入到 ST 的扩展设置区域
        const extensionsSettings = document.getElementById('extensions_settings');
        if (extensionsSettings) {
            extensionsSettings.insertAdjacentHTML('beforeend', settingsHtml);

            // 打开播放器按钮
            document.getElementById('rainy-ext-open-btn')?.addEventListener('click', () => {
                openPanel();});

            // 悬浮球开关
            document.getElementById('rainy-ext-show-fab')?.addEventListener('change', (e) => {
                const show = e.target.checked;
                updateSettings(s => { s.show_fab = show; return s; });
                const fab = document.getElementById('rainy-fab');
                if (fab) fab.style.display = show ? '' : 'none';
            });
        }
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 16: 手机端 VH 修正
    // ═══════════════════════════════════════

    function fixMobileVH() {
        function set() { document.documentElement.style.setProperty('--rainy-vh', `${window.innerHeight * 0.01}px`); }
        set();
        window.addEventListener('resize', set);
    }

    // ═══════════════════════════════════════
    // 📦 SECTION 17: 插件入口
    // ═══════════════════════════════════════

    function init() {
        console.log('[RainyPlayer] 🌧️ 初始化中...');
    

        fixMobileVH();
        applyTheme(storage.get('theme', 'default'));


        const settings = getSettings();

        // 悬浮球
        const fab = createFAB();
        if (settings.show_fab === false) fab.style.display = 'none';
        document.body.appendChild(fab);
        restoreFABPosition(fab);
        makeDraggable(fab);

        // 主面板
        panelEl = createMainPanel();
        document.body.appendChild(panelEl);

        // 状态栏
        updateStatusBarUI('idle');

        // ST 扩展面板入口
        createSTSettingsPanel();

        // ST 事件监听
        try {
            if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
                const ctx = SillyTavern.getContext();
                if (ctx.eventSource) {
                    const evt = ctx.eventTypes?.CHAT_CHANGED || 'chatLoaded';
                    ctx.eventSource.on(evt, () => {
                        //聊天切换时刷新摘要
                        reinitChannel('summary');
                    });
                }
            }
        } catch (e) {
            console.warn('[RainyPlayer] ST 事件监听失败:', e);
        }

        console.log('[RainyPlayer] 🌧️ 初始化完成！');
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else if (typeof jQuery !== 'undefined') {
        jQuery(init);
    } else {
        init();
    }

})();
