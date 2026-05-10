document.addEventListener('DOMContentLoaded', () => {
    const createModalButton = document.getElementById('create-modal-button');
    const modal = document.getElementById('modal');
    const hideModalButton = document.getElementById('hide-modal-button');
    const createTaskButton = document.getElementById('create-task-button');
    const taskTitle = document.getElementById('task-title');
    const taskDescription = document.getElementById('task-description');
    const taskDeadline = document.getElementById('task-deadline');
    const iconGroup = document.getElementById('icon-group');
    const icons = document.querySelectorAll('.icon');
    const taskContainer = document.getElementById('task-container');
    const searchInput = document.querySelector('#nav-header input[type="text"]');
    const statusFilterCompleted = document.getElementById('completed');
    const statusFilterPending = document.getElementById('pending');
    const statusFilterDue = document.getElementById('due');
    const dateFilterContainer = document.getElementById('date-filter');
    const dateFilterButtons = dateFilterContainer
        ? dateFilterContainer.querySelectorAll('input[type="button"]')
        : [];

    const noTaskContainer = document.getElementById('no-task-container');

    let icon = '';
    let taskBeingEdited = null;
    const dueSoonThresholdMs = 60 * 60 * 1000;
    let activeDateFilter = 'all';

    createModalButton.addEventListener('click', () => {
        resetModal();
        modal.classList.add('visible');
    });

    hideModalButton.addEventListener('click', () => {
        modal.classList.remove('visible');
        resetModal();
    });

    function isSameDay(left, right) {
        return (
            left.getFullYear() === right.getFullYear() &&
            left.getMonth() === right.getMonth() &&
            left.getDate() === right.getDate()
        );
    }

    function getDateFilterKey(value) {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'today') return 'today';
        if (normalized === 'yesterday') return 'yesterday';
        return 'older';
    }

    function matchesStatusFilter(task) {
        const status = task.dataset.taskStatus || 'Pending';
        const hasCompleted = statusFilterCompleted && statusFilterCompleted.checked;
        const hasPending = statusFilterPending && statusFilterPending.checked;
        const hasDue = statusFilterDue && statusFilterDue.checked;

        if (!hasCompleted && !hasPending && !hasDue) return true;

        if (hasCompleted && status === 'Completed') return true;
        if (hasPending && status === 'Pending') return true;
        if (hasDue && (status === 'Due' || status === 'Compromised')) return true;

        return false;
    }

    function matchesDateFilter(task) {
        if (activeDateFilter === 'all') return true;
        if (!task.dataset.taskCreatedAt) return false;

        const createdAt = new Date(task.dataset.taskCreatedAt);
        if (Number.isNaN(createdAt.getTime())) return false;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (activeDateFilter === 'today') {
            return isSameDay(createdAt, today);
        }

        if (activeDateFilter === 'yesterday') {
            return isSameDay(createdAt, yesterday);
        }

        return createdAt < yesterday;
    }

    function applyFilters() {
        updateAllTaskStatuses();

        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const tasks = taskContainer.querySelectorAll('.task');

        tasks.forEach((task) => {
            const title = (task.dataset.taskTitle || '').toLowerCase();
            const description = (task.dataset.taskDescription || '').toLowerCase();
            const matchesSearch = !query || title.includes(query) || description.includes(query);
            const matchesStatus = matchesStatusFilter(task);
            const matchesDate = matchesDateFilter(task);
            const shouldShow = matchesSearch && matchesStatus && matchesDate;

            task.classList.toggle('hidden', !shouldShow);
        });
    }

    function updateNoTaskVisibility() {
        const taskCount = taskContainer.querySelectorAll('.task').length;
        noTaskContainer.classList.toggle('hidden', taskCount > 0);
    }

    function formatDateLabel(date) {
        if (!date) return '';

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (targetDay.getTime() === today.getTime()) return 'Today';
        if (targetDay.getTime() === yesterday.getTime()) return 'Yesterday';

        return formatDate(date);
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    function formatDateTime(date) {
        return `${formatDate(date)} ${formatTime(date)}`;
    }

    function formatDateTimeInputValue(date) {
        if (!date) return '';
        return `${formatDate(date)}T${formatTime(date)}`;
    }

    function getTaskStatus(deadlineIso) {
        if (!deadlineIso) return 'Pending';

        const deadlineMs = Date.parse(deadlineIso);
        if (Number.isNaN(deadlineMs)) return 'Pending';

        const nowMs = Date.now();
        if (nowMs >= deadlineMs) return 'Compromised';
        if (deadlineMs - nowMs <= dueSoonThresholdMs) return 'Due';
        return 'Pending';
    }

    function updateTaskHeader(task) {
        const createdAt = task.dataset.taskCreatedAt
            ? new Date(task.dataset.taskCreatedAt)
            : null;
        const deadline = task.dataset.taskDeadline ? new Date(task.dataset.taskDeadline) : null;

        const createdLabel = task.querySelector('.task-created-label');
        const deadlineLabel = task.querySelector('.task-deadline-label');

        if (createdLabel) {
            createdLabel.textContent = formatDateLabel(createdAt);
        }

        if (deadlineLabel) {
            deadlineLabel.textContent = deadline ? `Ends: ${formatDateTime(deadline)}` : '';
        }
    }

    function updateTaskStatus(task) {
        const isCompleted = task.dataset.taskCompleted === 'true';
        const statusElement = task.querySelector('.task-status');
        if (!statusElement) return;

        statusElement.classList.remove('bg-green-300', 'bg-yellow-400', 'bg-red-500', 'bg-blue-500');

        if (isCompleted) {
            task.dataset.taskStatus = 'Completed';
            statusElement.textContent = 'Completed';
            statusElement.classList.add('bg-blue-500');
            return;
        }

        const status = getTaskStatus(task.dataset.taskDeadline);
        task.dataset.taskStatus = status;
        statusElement.textContent = status;

        if (status === 'Due') {
            statusElement.classList.add('bg-yellow-400');
        } else if (status === 'Compromised') {
            statusElement.classList.add('bg-red-500');
        } else {
            statusElement.classList.add('bg-green-300');
        }
    }

    function updateAllTaskStatuses() {
        taskContainer.querySelectorAll('.task').forEach((task) => {
            updateTaskStatus(task);
            updateTaskHeader(task);
        });
    }

    function chooseIcon() {
        icons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const iconElement = btn.querySelector('i');
                icon = iconElement.className.replace(' text-white', '');
            });
        });
    }

    createTaskButton.addEventListener('click', () => {
        const titleValue = taskTitle.value.trim();
        const descriptionValue = taskDescription.value.trim();
        const deadlineValue = taskDeadline.value.trim();

        if (!titleValue) {
            taskTitle.style.borderColor = 'red';
            taskTitle.setAttribute('placeholder', 'Title cannot be empty');
        }

        if (!descriptionValue) {
            taskDescription.style.borderColor = 'red';
            taskDescription.setAttribute('placeholder', 'Description cannot be empty');
        }

        if (!deadlineValue) {
            taskDeadline.style.borderColor = 'red';
        }

        if (!icon) {
            iconGroup.style.borderColor = 'red';
        }

        if (!titleValue || !descriptionValue || !icon || !deadlineValue) return;

        if (taskBeingEdited) {
            updateTask(taskBeingEdited, titleValue, descriptionValue, icon, deadlineValue);
        } else {
            createTask(titleValue, descriptionValue, icon, deadlineValue);
        }

        modal.classList.remove('visible');
        resetModal();
    });

    function createTask(title, description, iconClass, deadlineValue) {
        const task = document.createElement('div');
        const createdAt = new Date();
        const deadlineDate = new Date(deadlineValue);

        task.dataset.taskTitle = title;
        task.dataset.taskDescription = description;
        task.dataset.taskIcon = iconClass;
        task.dataset.taskCreatedAt = createdAt.toISOString();
        task.dataset.taskDeadline = deadlineDate.toISOString();
        task.dataset.taskCompleted = 'false';

        task.className =
            'task mt-5 shadow-md border-dotted border-gray-400 justify-self-center flex-col flex bg-linear-to-b bg-white min-h-1/3 h-auto min-w-12 w-1/2 rounded-2xl justify-start items-center';

        task.innerHTML = `
            <div class="rounded-t-2xl px-10 items-center justify-between flex w-full h-15">
                <span class="task-status text-white text-sm font-semibold px-3 py-1 rounded-md bg-green-300">Pending</span>
                <div class="flex flex-col text-right text-sm">
                    <span class="task-created-label font-semibold"></span>
                    <span class="task-deadline-label font-light"></span>
                </div>
            </div>

            <div class="mt-5 flex-1 flex w-full flex-col justify-start items-center break-normal pb-5 px-10">
                <span class="h-10 w-10 justify-center items-center flex rounded-md bg-green-300">
                    <i class="${iconClass} text-white task-icon"></i>
                </span>

                <h1 class="font-semibold text-xl task-title">
                    ${title}
                </h1>

                <h1 class="font-light task-description">
                    ${description}
                </h1>
            </div>

            <div class="pe-10 gap-2 flex rounded-b-md self-end w-full justify-end items-center h-17">
                <span class="complete-task-button h-10 w-10 justify-center items-center flex rounded-md bg-blue-500">
                    <i class="fa-regular fa-circle-check text-white"></i>
                </span>

                <span class="edit-task-button h-10 w-10 justify-center items-center flex rounded-md bg-yellow-300">
                    <i class="fa-regular fa-pen-to-square text-white"></i>
                </span>

                <span class="delete-task-button h-10 w-10 justify-center items-center flex rounded-md bg-red-500">
                    <i class="fa-regular fa-trash-can text-white"></i>
                </span>
            </div>
        `;

        taskContainer.appendChild(task);
        updateTaskHeader(task);
        updateTaskStatus(task);
        updateNoTaskVisibility();
        applyFilters();
    }

    function updateTask(task, title, description, iconClass, deadlineValue) {
        task.dataset.taskTitle = title;
        task.dataset.taskDescription = description;
        task.dataset.taskIcon = iconClass;
        task.dataset.taskDeadline = new Date(deadlineValue).toISOString();

        task.querySelector('.task-title').textContent = title;
        task.querySelector('.task-description').textContent = description;
        task.querySelector('.task-icon').className = `${iconClass} text-white`;

        updateTaskHeader(task);
        updateTaskStatus(task);

        applyFilters();
    }

    function resetModal() {
        taskTitle.value = '';
        taskDescription.value = '';
        taskDeadline.value = '';
        icon = '';
        taskBeingEdited = null;

        taskTitle.style.borderColor = '';
        taskDescription.style.borderColor = '';
        taskDeadline.style.borderColor = '';
        iconGroup.style.borderColor = '';
    }

    document.addEventListener('click', (e) => {
        const completeButton = e.target.closest('.complete-task-button');
        const editButton = e.target.closest('.edit-task-button');
        const deleteButton = e.target.closest('.delete-task-button');

        if (completeButton) {
            const task = completeButton.closest('.task');
            if (!task) return;

            task.dataset.taskCompleted = 'true';
            updateTaskStatus(task);
            taskContainer.appendChild(task);
            applyFilters();
            return;
        }

        if (editButton) {
            const task = editButton.closest('.task');
            if (!task) return;

            taskBeingEdited = task;

            taskTitle.value = task.dataset.taskTitle;
            taskDescription.value = task.dataset.taskDescription;
            icon = task.dataset.taskIcon;
            taskDeadline.value = formatDateTimeInputValue(
                task.dataset.taskDeadline ? new Date(task.dataset.taskDeadline) : null
            );

            modal.classList.add('visible');
        }

        if (deleteButton) {
            const task = deleteButton.closest('.task');
            if (task) {
                task.remove();
                updateNoTaskVisibility();
                applyFilters();
            }
        }
    });

    chooseIcon();
    updateNoTaskVisibility();
    applyFilters();

    setInterval(applyFilters, 60000);

    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    if (statusFilterCompleted) {
        statusFilterCompleted.addEventListener('change', applyFilters);
    }

    if (statusFilterPending) {
        statusFilterPending.addEventListener('change', applyFilters);
    }

    if (statusFilterDue) {
        statusFilterDue.addEventListener('change', applyFilters);
    }

    dateFilterButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const selected = getDateFilterKey(button.value || '');
                activeDateFilter = activeDateFilter === selected ? 'all' : selected;
                applyFilters();
            });
        });
    });