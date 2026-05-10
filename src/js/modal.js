document.addEventListener('DOMContentLoaded', () => {
    const createModalButton = document.getElementById('create-modal-button');
    const modal = document.getElementById('modal');
    const hideModalButton = document.getElementById('hide-modal-button');
    const createTaskButton = document.getElementById('create-task-button');
    const taskTitle = document.getElementById('task-title');
    const taskDescription = document.getElementById('task-description');
    const iconGroup = document.getElementById('icon-group');
    const icons = document.querySelectorAll('.icon');
    const taskContainer = document.getElementById('task-container');
    const searchInput = document.querySelector('#nav-header input[type="text"]');

    const noTaskContainer = document.getElementById('no-task-container');

    let icon = '';
    let taskBeingEdited = null;

    createModalButton.addEventListener('click', () => {
        resetModal();
        modal.classList.add('visible');
    });

    hideModalButton.addEventListener('click', () => {
        modal.classList.remove('visible');
        resetModal();
    });

    function applySearchFilter() {
        if (!searchInput) return;

        const query = searchInput.value.trim().toLowerCase();
        const tasks = taskContainer.querySelectorAll('.task');

        tasks.forEach((task) => {
            const title = (task.dataset.taskTitle || '').toLowerCase();
            const description = (task.dataset.taskDescription || '').toLowerCase();
            const matches = !query || title.includes(query) || description.includes(query);

            task.classList.toggle('hidden', !matches);
        });
    }

    function updateNoTaskVisibility() {
        const taskCount = taskContainer.querySelectorAll('.task').length;
        noTaskContainer.classList.toggle('hidden', taskCount > 0);
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

        if (!titleValue) {
            taskTitle.style.borderColor = 'red';
            taskTitle.setAttribute('placeholder', 'Title cannot be empty');
        }

        if (!descriptionValue) {
            taskDescription.style.borderColor = 'red';
            taskDescription.setAttribute('placeholder', 'Description cannot be empty');
        }

        if (!icon) {
            iconGroup.style.borderColor = 'red';
        }

        if (!titleValue || !descriptionValue || !icon) return;

        if (taskBeingEdited) {
            updateTask(taskBeingEdited, titleValue, descriptionValue, icon);
        } else {
            createTask(titleValue, descriptionValue, icon);
        }

        modal.classList.remove('visible');
        resetModal();
    });

    function createTask(title, description, iconClass) {
        const task = document.createElement('div');

        task.dataset.taskTitle = title;
        task.dataset.taskDescription = description;
        task.dataset.taskIcon = iconClass;

        task.className =
            'task mt-5 shadow-md border-dotted border-gray-400 justify-self-center flex-col flex bg-linear-to-b bg-white min-h-1/3 h-auto min-w-12 w-1/2 rounded-2xl justify-start items-center';

        task.innerHTML = `
            <div class="rounded-t-2xl px-10 items-center justify-between flex w-full h-15">
                <h1 class="font-semibold">Pending</h1>
                <h1 class="font-semibold">Today, 7:00 AM</h1>
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
                <span class="edit-task-button h-10 w-10 justify-center items-center flex rounded-md bg-yellow-300">
                    <i class="fa-regular fa-pen-to-square text-white"></i>
                </span>

                <span class="delete-task-button h-10 w-10 justify-center items-center flex rounded-md bg-red-500">
                    <i class="fa-regular fa-trash-can text-white"></i>
                </span>
            </div>
        `;

        taskContainer.appendChild(task);
        updateNoTaskVisibility();
        applySearchFilter();
    }

    function updateTask(task, title, description, iconClass) {
        task.dataset.taskTitle = title;
        task.dataset.taskDescription = description;
        task.dataset.taskIcon = iconClass;

        task.querySelector('.task-title').textContent = title;
        task.querySelector('.task-description').textContent = description;
        task.querySelector('.task-icon').className = `${iconClass} text-white`;

        applySearchFilter();
    }

    function resetModal() {
        taskTitle.value = '';
        taskDescription.value = '';
        icon = '';
        taskBeingEdited = null;

        taskTitle.style.borderColor = '';
        taskDescription.style.borderColor = '';
        iconGroup.style.borderColor = '';
    }

    document.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-task-button');
        const deleteButton = e.target.closest('.delete-task-button');

        if (editButton) {
            const task = editButton.closest('.task');
            if (!task) return;

            taskBeingEdited = task;

            taskTitle.value = task.dataset.taskTitle;
            taskDescription.value = task.dataset.taskDescription;
            icon = task.dataset.taskIcon;

            modal.classList.add('visible');
        }

        if (deleteButton) {
            const task = deleteButton.closest('.task');
            if (task) {
                task.remove();
                updateNoTaskVisibility();
            }
        }
    });

    chooseIcon();
    updateNoTaskVisibility();

    if (searchInput) {
        searchInput.addEventListener('input', applySearchFilter);
    }
});