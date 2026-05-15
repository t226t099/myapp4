// 状態管理
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let streak = JSON.parse(localStorage.getItem('streak')) || { count: 0, lastDate: null };
let currentCalendarDate = new Date();
let selectedDate = new Date().toISOString().split('T')[0];

// DOM要素
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const streakCount = document.getElementById('streak-count');
const aiMessage = document.getElementById('ai-message');
const calendarDays = document.getElementById('calendar-days');
const calendarMonthYear = document.getElementById('calendar-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// 褒め言葉リスト
const praiseMessages = {
    generic: [
        "素晴らしい！その調子です。",
        "着実に進んでいますね。自分を褒めてあげてください！",
        "ナイス！タスクが一つ片付きました。",
        "完璧です。あなたの集中力、尊敬します。",
        "一歩ずつ、確実に目標に近づいていますよ。"
    ],
    milestones: {
        1: "まずは一歩、素晴らしいスタートです！今日から新しい習慣が始まります。",
        3: "三日坊主を卒業！習慣化の波に乗っていますね。最高です！",
        7: "1週間継続！あなたはもうタスク管理の達人です。誇りに思ってください！",
        10: "10日連続！信じられない持続力です。あなたの努力は必ず報われます。",
        30: "1ヶ月継続達成！！もはやこれは才能です。あなたは最強の実行者です！"
    }
};

// 初期化
function init() {
    handleDailyReset();
    checkStreakReset();
    renderCalendar();
    renderTodos();
    updateStreakDisplay();
    updateAIMessage(); // 初期メッセージの設定
}

// 日付変更時の日課タスクリセット
function handleDailyReset() {
    const today = new Date().toISOString().split('T')[0];
    const lastAccess = localStorage.getItem('lastAccessDate');

    if (lastAccess && lastAccess !== today) {
        todos = todos.map(todo => {
            if (todo.type === 'daily') {
                return { ...todo, completed: false };
            }
            return todo;
        });
        saveTodos();
    }
    localStorage.setItem('lastAccessDate', today);
}

// 起動時にストリークが途切れているか確認
function checkStreakReset() {
    if (!streak.lastDate) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastDate !== today && streak.lastDate !== yesterdayStr) {
        streak.count = 0;
        localStorage.setItem('streak', JSON.stringify(streak));
    }
}

// カレンダーの描画
function renderCalendar() {
    calendarDays.innerHTML = '';
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    calendarMonthYear.textContent = `${year}年${month + 1}月`;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        createDayElement(lastDayOfPrevMonth - i, true);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        createDayElement(i, false);
    }

    const totalDaysShown = firstDayOfMonth + daysInMonth;
    const remainingDays = 42 - totalDaysShown;
    for (let i = 1; i <= remainingDays; i++) {
        createDayElement(i, true);
    }
}

function createDayElement(day, isOtherMonth) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    if (isOtherMonth) dayDiv.classList.add('other-month');

    const date = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + (isOtherMonth ? (day > 15 ? -1 : 1) : 0), day);
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    dayDiv.textContent = day;

    if (dateStr === todayStr) dayDiv.classList.add('today');
    if (dateStr === selectedDate) dayDiv.classList.add('selected');

    const hasCompleted = todos.some(t => {
        const taskDate = t.createdAt.split('T')[0];
        // 今日なら今の完了状況、過去ならその日のログ（簡易的に作成日で判定）
        return (t.completed && taskDate === dateStr) || (t.type === 'daily' && t.completed && todayStr === dateStr);
    });

    if (hasCompleted) {
        const dotContainer = document.createElement('div');
        dotContainer.className = 'dot-container';
        const dot = document.createElement('div');
        dot.className = 'dot';
        dotContainer.appendChild(dot);
        dayDiv.appendChild(dotContainer);
    }

    dayDiv.addEventListener('click', () => {
        selectedDate = dateStr;
        renderCalendar();
        renderTodos();
        updateAIMessage();
    });

    calendarDays.appendChild(dayDiv);
}

// 月移動
prevMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
});

// ストリークの更新
function handleStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = streak.lastDate;

    if (lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
        streak.count++;
    } else {
        streak.count = 1;
    }

    streak.lastDate = today;
    localStorage.setItem('streak', JSON.stringify(streak));
    updateStreakDisplay();
}

function updateStreakDisplay() {
    streakCount.textContent = streak.count;
}

// AIメッセージの更新
function updateAIMessage(isTaskCompleted = false) {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 今日以外の表示
    if (selectedDate !== todayStr) {
        const dateObj = new Date(selectedDate);
        const formattedDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
        aiMessage.textContent = `${formattedDate}の予定を確認しています。`;
        return;
    }

    // 今日のタスク状況
    const remainingTasks = todos.filter(t => !t.completed).length;
    
    if (isTaskCompleted) {
        // タスク完了時の特別な褒め言葉
        showPraise();
    } else if (remainingTasks === 0 && todos.length > 0) {
        aiMessage.textContent = "完璧です！今日やるべきことは全て終わりました！";
    } else if (todos.length === 0) {
        aiMessage.textContent = "タスクを入力して、一日を始めましょう！";
    } else {
        aiMessage.textContent = `今日はあと${remainingTasks}件のタスクが残っています。応援しています！`;
    }
}

function showPraise() {
    let message = "";
    if (praiseMessages.milestones[streak.count]) {
        message = praiseMessages.milestones[streak.count];
    } else {
        const randomIndex = Math.floor(Math.random() * praiseMessages.generic.length);
        message = praiseMessages.generic[randomIndex];
    }
    aiMessage.textContent = message;
    
    aiMessage.style.transform = "scale(1.05)";
    setTimeout(() => {
        aiMessage.style.transform = "scale(1)";
    }, 200);
}

// タスクの描画
function renderTodos() {
    todoList.innerHTML = '';
    const todayStr = new Date().toISOString().split('T')[0];

    const filteredTodos = todos.filter(t => {
        const taskDate = t.createdAt.split('T')[0];
        
        // 日課タスクは今日以降なら常に表示
        if (t.type === 'daily') {
            return selectedDate >= taskDate;
        }
        
        // 単発タスクはその日のみ表示
        return taskDate === selectedDate;
    });

    filteredTodos.forEach((todo) => {
        const originalIndex = todos.indexOf(todo);
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        const dateStr = todo.createdAt ? new Date(todo.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) : '';
        const typeLabel = todo.type === 'daily' ? '日課' : '単発';
        const typeClass = todo.type === 'daily' ? 'badge-daily' : 'badge-single';

        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <div class="todo-content">
                <div class="todo-header">
                    <span class="todo-text">${todo.text}</span>
                </div>
                <div class="todo-meta">
                    <span class="badge ${typeClass}">${typeLabel}</span>
                    <span class="todo-date">${dateStr}</span>
                </div>
            </div>
            <button class="delete-btn">&times;</button>
        `;

        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', () => toggleTodo(originalIndex));

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTodo(originalIndex));

        todoList.appendChild(li);
    });

    if (filteredTodos.length === 0) {
        const emptyMsg = document.createElement('li');
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.padding = '2rem';
        emptyMsg.style.color = '#999';
        emptyMsg.textContent = 'この日のタスクはありません';
        todoList.appendChild(emptyMsg);
    }
}

// タスク追加
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    const type = document.querySelector('input[name="task-type"]:checked').value;
    
    if (text) {
        todos.push({ 
            text, 
            completed: false, 
            type: type, 
            createdAt: new Date().toISOString() 
        });
        todoInput.value = '';
        saveAndRender();
        renderCalendar();
        updateAIMessage();
    }
});

function toggleTodo(index) {
    const wasCompleted = todos[index].completed;
    todos[index].completed = !todos[index].completed;
    
    if (!wasCompleted && todos[index].completed) {
        handleStreak();
        updateAIMessage(true); // 褒め言葉モード
    } else {
        updateAIMessage(); // 通常のリマインドモード
    }
    
    saveAndRender();
    renderCalendar();
}

function deleteTodo(index) {
    todos.splice(index, 1);
    saveAndRender();
    renderCalendar();
    updateAIMessage();
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function saveAndRender() {
    saveTodos();
    renderTodos();
}

init();
