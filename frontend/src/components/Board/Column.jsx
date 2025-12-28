// frontend/src/components/Board/Column.jsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const Column = ({ column, tasks, onTaskClick }) => {
  const { setNodeRef } = useDroppable({
    id: `column-${column._id}`,
    data: {
      columnId: column._id
    }
  });

  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
  const taskIds = sortedTasks.map(task => task._id);

  return (
    <div className="column" ref={setNodeRef}>
      <div className="column-header">
        <div className="column-title-wrapper">
          <h3 className="column-title">{column.name}</h3>
          <span className="column-count">{tasks.length}</span>
        </div>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="column-tasks">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              columnId={column._id}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default Column;