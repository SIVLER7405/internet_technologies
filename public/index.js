const API_URL = 'http://localhost:4320';

class AppModel {
  static async getTasklists() {
    const tasklistsRes = await fetch(`${API_URL}/tasklists`);
    return await tasklistsRes.json();
  }

  static async addTasklist(tasklistName, counter) {
    const result = await fetch(
      `${API_URL}/tasklists`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tasklistName, counter })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async addTask({
    tasklistId,
    taskName
  }) {
    const result = await fetch(
      `${API_URL}/tasklists/${tasklistId}/tasks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskName })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async editTask({
    tasklistId,
    taskId,
    newTaskName
  }) {
    const result = await fetch(
      `${API_URL}/tasklists/${tasklistId}/tasks/${taskId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newTaskName })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async editTasklist({
    id,
    newTaskName
  }) {
    const result = await fetch(
      `${API_URL}/tasklists/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newTaskName })
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async deleteTask({
    tasklistId,
    taskId
  }) {
    const result = await fetch(
      `${API_URL}/tasklists/${tasklistId}/tasks/${taskId}`,
      {
        method: 'DELETE'
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }

  static async deleteTasklist({
    id,
  }) {
    const result = await fetch(
      `${API_URL}/tasklists/${id}`,
      {
        method: 'DELETE'
      }
    );

    const resultData = await result.json();

    return result.status === 200
      ? resultData
      : Promise.reject(resultData);
  }
}

class App {
  constructor() {
    this.tasklists = [];
  }

  createTaskList = async () => {
    const nameInput = document.getElementById('name-input');
    const counterInput = document.getElementById('counter-input');

    const name = nameInput.value;
    const counter = counterInput.value;

    nameInput.value = '';
    counterInput.value = '';


    await AppModel.addTasklist(name, counter);

    const newTaskList = new Tasklist({
      tlName: name,
      tlCounter: counter,
      tlID: `TL${this.tasklists.length}`,
      tlTasks: [],
    });
    this.tasklists.push(newTaskList);
    this.tasklists.sort();
    this.reRenderTasklists();
  };

  async init() {
    const tasklists = await AppModel.getTasklists();
    tasklists.forEach(({ tasklistName, counter, tasks }) => {
      const newTasklist = new Tasklist({
        tlName: tasklistName,
        tlCounter: counter,
        tlID: `TL${this.tasklists.length}`,
        tasks: tasks.slice(),
      });

      this.tasklists.push(newTasklist);
    });
    this.tasklists.sort();
    this.reRenderTasklists();

    document.getElementById('tm-tasklist-add-tasklist')
      .addEventListener(
        'click',
        (event) => {
          this.createTaskList();
        }
      );

    document.querySelector('.button-carousel-right')
      .addEventListener(
        'click',
        () => {
          const mainStyle = document.querySelector('main').style;
          const selected = Number(mainStyle.getPropertyValue('--selected'));
          mainStyle.setProperty('--selected', selected + 1);
        }
      );

    document.querySelector('.button-carousel-left')
      .addEventListener(
        'click',
        () => {
          const mainStyle = document.querySelector('main').style;
          const selected = Number(mainStyle.getPropertyValue('--selected'));
          mainStyle.setProperty('--selected', selected - 1);
        }
      );
  }

  reRenderTasklists() {
    const container = document.querySelector('main');
    container.style.setProperty('--lists', String(this.tasklists.length));

    const tasksElements = document.querySelectorAll('main .deletable-tasklist');
    tasksElements.forEach((element) => element.remove())

    this.tasklists.forEach((tasklist, idx) => {
      tasklist.render(idx);
      tasklist.rerenderTasks();
    })
  }
}

class Tasklist {
  constructor({
    tlName,
    tlCounter,
    tlID,
    tasks,
  }) {
    this.tlName = tlName;
    this.tasks = tasks || [];
    this.tlCounter = tlCounter;
    this.tlID = tlID;
  }

  onAddTaskButtonClick = async () => {
    const newTaskName = prompt('Введите название услуги:');

    if (!newTaskName) return;

    const tasklistId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.addTask({
        tasklistId,
        taskName: newTaskName
      });
      this.addTask(newTaskName);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  addTask = (taskName) => {
    document.querySelector(`#${this.tlID} ul`)
      .appendChild(
        this.renderTask({
          taskID: `${this.tlID}-T${this.tasks.length}`,
          taskName
        })
      );

    this.tasks.push(taskName);
  };

  onDeleteTaskButtonClick = async (taskID) => {
    const taskIndex = Number(taskID.split('-T')[1]);
    const taskName = this.tasks[taskIndex];

    if (!confirm(`Услуга '${taskName}' будет удалена. Продолжить?`))
      return;

    const tasklistId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.deleteTask({
        tasklistId,
        taskId: taskIndex
      });

      this.deleteTask(taskIndex);
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  deleteTask = (taskIndex) => {
    this.tasks.splice(taskIndex, 1);
    this.tlCounter += 1;
    this.rerenderTasks();
  };

  onEditTask = async (taskID) => {
    const taskIndex = Number(taskID.split('-T')[1]);
    const oldTaskName = this.tasks[taskIndex];

    const newTaskName = prompt('Введите новое описание задачи', oldTaskName);

    if (!newTaskName || newTaskName === oldTaskName) {
      return;
    }

    const tasklistId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.editTask({
        tasklistId,
        taskId: taskIndex,
        newTaskName
      });

      this.tasks[taskIndex] = newTaskName;
      document.querySelector(`#${taskID} span`)
          .innerHTML = newTaskName;
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  onDeleteTasklist = async () => {
    if (!confirm(`Тариф '${this.tlName}' будет удален. Продолжить?`))
      return;

    const tasklistId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.deleteTasklist({
        id: tasklistId,
      });

      const idx = app.tasklists.findIndex(tl => tl === this);
      app.tasklists.splice(idx, 1);
      app.reRenderTasklists();
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  onEditTasklist = async () => {
    const oldTaskName = this.tlName;
    const newTaskName = prompt('Введите новое описание задачи', oldTaskName);
    if (!newTaskName || newTaskName === oldTaskName) {
      return;
    }

    const tasklistId = Number(this.tlID.split('TL')[1]);
    try {
      await AppModel.editTasklist({
        id: tasklistId,
        newTaskName
      });

      this.tlName = newTaskName;
      document.querySelector(`#${this.tlID} span`)
        .innerHTML = newTaskName;
    } catch (error) {
      console.error('ERROR', error);
    }
  };

  rerenderTasks = () => {
    const tasklist = document.querySelector(`#${this.tlID} ul`);
    tasklist.innerHTML = '';

    this.tasks.forEach((taskName, taskIndex) => {
      tasklist.appendChild(
        this.renderTask({
          taskID: `${this.tlID}-T${taskIndex}`,
          taskName
        })
      );
    });
  };

  renderTask = ({ taskID, taskName }) => {
    const task = document.createElement('li');
    task.classList.add('tm-tasklist-task');
    task.id = taskID;

    const span = document.createElement('span');
    span.classList.add('tm-tasklist-task-text');
    span.innerHTML = taskName;
    task.appendChild(span);

    const controls = document.createElement('div');
    controls.classList.add('tm-tasklist-task-controls');

    const upperRow = document.createElement('div');
    upperRow.classList.add('tm-tasklist-task-controls-row');

    controls.appendChild(upperRow);

    const lowerRow = document.createElement('div');
    lowerRow.classList.add('tm-tasklist-task-controls-row');

    const editButton = document.createElement('button');
    editButton.classList.add(
      'tm-tasklist-task-controls-button',
      'edit-icon'
    );
    editButton.addEventListener('click', () => this.onEditTask(taskID));
    lowerRow.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add(
      'tm-tasklist-task-controls-button',
      'delete-icon'
    );
    deleteButton.addEventListener('click', () => this.onDeleteTaskButtonClick(taskID));
    lowerRow.appendChild(deleteButton);

    controls.appendChild(lowerRow);

    task.appendChild(controls);

    return task;
  };

  render(idx) {
    const tasklist = document.createElement('div');
    tasklist.style.setProperty('--index', idx);
    tasklist.classList.add('tm-tasklist', 'deletable-tasklist');
    tasklist.id = this.tlID;
    tasklist.addEventListener('click', (event) => {
      const mainStyle = document.querySelector('main').style;
      // const selected = Number(mainStyle.getPropertyValue('--selected'));
      mainStyle.setProperty('--selected', String(idx));
    });

    const header = document.createElement('header');
    header.classList.add('tm-tasklist-header');
      const name = document.createElement('span');
      name.innerHTML = this.tlName;
      const controls = document.createElement('div');
      controls.classList.add('tm-tasklist-task-controls');
        const editButton = document.createElement('button');
        editButton.classList.add(
          'tm-tasklist-task-controls-button',
          'edit-icon'
        );
        editButton.addEventListener('click', this.onEditTasklist);
        const delButton = document.createElement('button');
        delButton.classList.add(
          'tm-tasklist-task-controls-button',
          'delete-icon'
        );
        delButton.addEventListener('click', this.onDeleteTasklist);
      controls.appendChild(editButton);
      controls.appendChild(delButton);
    header.appendChild(name);
    header.appendChild(controls);
    tasklist.appendChild(header);

    const counter = document.createElement('div');
    counter.classList.add('tm-tasklist-description');
    counter.classList.add('counter-info');
    counter.innerHTML = `${this.tlCounter} ₽`;
    tasklist.appendChild(counter);

    const hr = document.createElement('hr');
    hr.classList.add('tm-tasklist-hr');
    tasklist.appendChild(hr);

    const info = document.createElement('div');
    info.classList.add('tm-tasklist-info');
    info.innerHTML = 'Услуги:';
    tasklist.appendChild(info);

    const list = document.createElement('ul');
    list.classList.add('tm-tasklist-tasks');
    tasklist.appendChild(list);

    const footer = document.createElement('footer');
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('tm-tasklist-add-task');
    button.innerHTML = 'Добавить услугу';
    if (this.tlCounter <= 0)
      button.setAttribute('disabled', '');
    button.addEventListener('click', this.onAddTaskButtonClick);
    footer.appendChild(button);
    tasklist.appendChild(footer);

    const container = document.querySelector('main');
    container.insertBefore(tasklist, container.lastElementChild);
  }
}


// -------------------

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
