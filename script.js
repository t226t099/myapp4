// 状態管理
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let streak = JSON.parse(localStorage.getItem('streak')) || { count: 0, lastDate: null };
let currentCalendarDate = new Date();
let selectedDate = new Date().toISOString().split('T')[0];

// DOM要素
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoPriority = document.getElementById('todo-priority');
const todoList = document.getElementById('todo-list');
const streakCount = document.getElementById('streak-count');
const aiMessage = document.getElementById('ai-message');
const calendarDays = document.getElementById('calendar-days');
const calendarMonthYear = document.getElementById('calendar-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercent = document.getElementById('progress-percent');
const clearCompletedBtn = document.getElementById('clear-completed');

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
    updateAIMessage();
    updateProgress();
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
        updateProgress();
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

// 進捗の更新
function updateProgress() {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentDisplayTodos = todos.filter(t => {
        const taskDate = t.createdAt.split('T')[0];
        if (t.type === 'daily') return selectedDate >= taskDate;
        return taskDate === selectedDate;
    });

    if (currentDisplayTodos.length === 0) {
        progressBarFill.style.width = '0%';
        progressPercent.textContent = '0%';
        return;
    }

    const completedCount = currentDisplayTodos.filter(t => t.completed).length;
    const percent = Math.round((completedCount / currentDisplayTodos.length) * 100);
    
    progressBarFill.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;

    // 100%達成時のAIメッセージ（今日の場合のみ）
    if (percent === 100 && selectedDate === todayStr && completedCount > 0) {
        aiMessage.textContent = "おめでとうございます！全てのタスクを達成しました！最高の一日ですね！";
    }
}

// AIメッセージの更新
function updateAIMessage(isTaskCompleted = false) {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const currentDisplayTodos = todos.filter(t => {
        const taskDate = t.createdAt.split('T')[0];
        if (t.type === 'daily') return selectedDate >= taskDate;
        return taskDate === selectedDate;
    });

    if (selectedDate !== todayStr) {
        const dateObj = new Date(selectedDate);
        const formattedDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
        aiMessage.textContent = `${formattedDate}の予定を確認しています。`;
        return;
    }

    const remainingTasks = currentDisplayTodos.filter(t => !t.completed).length;
    
    if (isTaskCompleted) {
        showPraise();
    } else if (remainingTasks === 0 && currentDisplayTodos.length > 0) {
        aiMessage.textContent = "完璧です！今日やるべきことは全て終わりました！";
    } else if (currentDisplayTodos.length === 0) {
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
        if (t.type === 'daily') return selectedDate >= taskDate;
        return taskDate === selectedDate;
    });

    // 優先度順にソート（高 > 中 > 低）
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    filteredTodos.sort((a, b) => priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium']);

    filteredTodos.forEach((todo) => {
        const originalIndex = todos.indexOf(todo);
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        const dateStr = todo.createdAt ? new Date(todo.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) : '';
        const typeLabel = todo.type === 'daily' ? '日課' : '単発';
        const typeClass = todo.type === 'daily' ? 'badge-daily' : 'badge-single';
        const priorityClass = `priority-${todo.priority || 'medium'}`;

        li.innerHTML = `
            <div class="priority-badge ${priorityClass}"></div>
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
    const priority = todoPriority.value;
    
    if (text) {
        todos.push({ 
            text, 
            completed: false, 
            type: type, 
            priority: priority,
            createdAt: new Date().toISOString() 
        });
        todoInput.value = '';
        saveAndRender();
        renderCalendar();
        updateAIMessage();
        updateProgress();
    }
});

function toggleTodo(index) {
    const wasCompleted = todos[index].completed;
    todos[index].completed = !todos[index].completed;
    
    if (!wasCompleted && todos[index].completed) {
        handleStreak();
        updateAIMessage(true);
    } else {
        updateAIMessage();
    }
    
    saveAndRender();
    renderCalendar();
    updateProgress();
}

function deleteTodo(index) {
    todos.splice(index, 1);
    saveAndRender();
    renderCalendar();
    updateAIMessage();
    updateProgress();
}

// 完了済みを一括削除
clearCompletedBtn.addEventListener('click', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 表示されている完了済みタスクを削除対象にする
    const toDelete = todos.filter(t => {
        const taskDate = t.createdAt.split('T')[0];
        const isShown = (t.type === 'daily' && selectedDate >= taskDate) || (taskDate === selectedDate);
        return isShown && t.completed;
    });

    if (toDelete.length === 0) return;

    if (confirm(`${toDelete.length}件の完了済みタスクを削除しますか？`)) {
        todos = todos.filter(t => !toDelete.includes(t));
        saveAndRender();
        renderCalendar();
        updateAIMessage();
        updateProgress();
    }
});

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function saveAndRender() {
    saveTodos();
    renderTodos();
}

init();
