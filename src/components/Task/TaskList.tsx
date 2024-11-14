import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  AlignLeft,
  CheckCircle,
} from "lucide-react";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { gapi } from "gapi-script";
import "./task.css";
import Modal from "../Modal.tsx";
import {  toast,Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Task {
  id: string;
  title: string;
  notes?: string;
  status: "needsAction" | "completed";
  due?: string;
  completed?: string;
  parent?: string;
  subtasks?: Task[];
}

interface TaskListProps {
  selectedTask: any;
  setSelectedTask: React.Dispatch<React.SetStateAction<string>>;
}

const TaskList: React.FC<TaskListProps> = ({
  selectedTask,
  setSelectedTask,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [taskId, setTaskId] = useState('')

  const [selectedSubTask, setSelectedSubTask] = useState<Task | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const clientId =  "830735989734-bhku50l8hsj0bj0d88rgto3sggk75iqg.apps.googleusercontent.com" ;
  const scope = "https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/tasks.readonly";

  const style = {
    position: "bottom-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    transition: Bounce,
  };

  useEffect(() => {
    console.log(" selectedSubTask >> :", selectedSubTask);
  }, [selectedSubTask]);
  useEffect(() => {
    const initializeGapiClient = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          gapi.load("client:auth2", {
            callback: resolve,
            onerror: reject,
          });
        });

        await gapi.client.init({
          clientId: clientId,
          scope: scope,
        });

        const authInstance = gapi.auth2.getAuthInstance();
        setAuthToken(gapi.client.getToken());
        setIsAuthenticated(authInstance.isSignedIn.get());
      } catch (error) {
        console.error("Error initializing GAPI:", error);
      }
    };

    initializeGapiClient();
  }, []);

  useEffect(() => {
    if (isAuthenticated && authToken) {
      getTaskById(selectedTask?.id);
    }
  }, [isAuthenticated, selectedTask]);

  const getTaskById = async (taskListId: string): Promise<void> => {
    try {
      // setIsLoading(true);
      const tokenObject = gapi.client.getToken();
      const response = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokenObject?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data?.items) {
        console.log("sub task List", data?.items);
        const dup: Task[] = data.items
          ?.map((ele: Task) => {
            // ele.isOpened = false;
            if (!ele?.parent) {
              ele.subtasks = data?.items?.filter(
                (item: Task) => item?.parent && ele?.id === item?.parent
              );
              return ele;
            } else {
              return null;
            }
          })
          .filter((ele: Task | null) => ele) as Task[];
        console.log("task list:>> ", dup);
        if (selectedSubTask?.subtasks?.length) {
          setSelectedSubTask((prev) => {
            const dupList = { ...prev };
            const subTask = dup.filter((ele) => ele?.id === dupList?.id)[0];
            // dupList.subtasks = subTask[0]
            console.log();
            return { ...subTask };
          });
        }
        setTasks(dup || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handlerCompleteTask = async (
    tasklistId: string,
    taskId: string
  ): Promise<void> => {
    try {
      const tokenObject = gapi.client.getToken();
      if (!tokenObject || !tokenObject.access_token) {
        throw new Error("No access token available");
      }

      const response = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${tokenObject.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "completed",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to complete task");
      }

      await response.json();
      toast("Task completed successfully", style);
      getTaskById(selectedTask?.id);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setOpenModal(false)
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderTaskCard = (task: Task) => (
    <div
      key={task.id}
      className={`list-card bg-white rounded-lg shadow-sm p-[13px] cursor-pointer hover:shadow-md transition-all duration-200 border h-max ${
        selectedTask?.id === task.id
          ? "border-blue-500"
          : "border-gray-100 hover:border-blue-200"
      }`}
      onClick={() => setSelectedSubTask(task)}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800 mb-0 capitalize">
          {task.title}
        </h2>
        {task.subtasks && task.subtasks?.length > 0 && (
          <p className="text-sm text-gray-600 font-semibold flex items-center">
            {task.subtasks.length}
            <ChevronRight className="w-4 h-4 mr-1 text-gray-500" />
          </p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 date">
          {task.due ? formatDate(task.due) : "No due date"}
        </span>
        <div
          className={`flex items-center justify-center gap-2 text-sm  ${
            task.status === "completed" ? "done" : "complete"
          }`}
          onClick={(e) => {
            if( task.status !== "completed"){
              e.stopPropagation();
              setTaskId(task.id)
              setOpenModal(true)

            }
            // handlerCompleteTask(selectedTask?.id, task.id);
          }}
        >
          {task.status === "completed" && <CheckCircle />}
          <button className="rounded-md flex items-center justify-center">
            {task.status === "completed" ? <>{"Done"}</> : "Complete"}
          </button>
        </div>
      </div>
    </div>
  );

  const toggleSubtaskExpanded = (subtaskId: string) => {
    setExpandedSubtasks((prev) =>
      prev.includes(subtaskId)
        ? prev.filter((id) => id !== subtaskId)
        : [...prev, subtaskId]
    );
  };

  const renderSubtaskDetails = (task: Task) => (
    <>
      <h2 className="font-semibold text-gray-800 mb-0 capitalize">Sub task</h2>
      {task?.subtasks?.length > 0 ? (
        <div className="border-gray-100 mt-2 sub-task">
          {task.subtasks &&
            task.subtasks.map((subtask, idx) => (
              <div
                key={subtask.id}
                className="border-b border-gray-100 last:border-b-0"
              >
                <div
                  className="p-4 cursor-pointer flex items-center justify-between title capitalize"
                  onClick={() => toggleSubtaskExpanded(subtask.id)}
                >
                  <span
                    className={`font-medium ${
                      subtask.status === "completed" ? "Done" : "Complete"
                    }`}
                  >
                    {subtask.title}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                      expandedSubtasks.includes(subtask.id)
                        ? "transform rotate-180"
                        : ""
                    }`}
                  />
                </div>
                {(expandedSubtasks.includes(subtask.id) || idx === 0) && (
                  <div className="px-4 pb-4">
                    {subtask.notes && (
                      <p className="text-sm text-gray-600 mt-2 flex items-center capitalize">
                        <AlignLeft className="w-4 h-4 mr-2 text-gray-400" />
                        {subtask.notes}
                      </p>
                    )}
                    {subtask.due && (
                      <p className="text-sm text-gray-600 mt-2 flex items-center capitalize">
                        <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                        Due: {formatDate(subtask.due)}
                      </p>
                    )}
                    {subtask.status === "completed" ? (
                      <p className="text-sm text-gray-500 mt-2 flex items-center capitalize">
                        <CheckCircle
                          className={`w-4 h-4 mr-2 text-green-500`}
                        />
                        Completed: {formatDate(subtask.completed)}
                      </p>
                    ) : (
                      <div
                        className={`flex items-center justify-center gap-2 text-sm mt-2 ${
                          task.status === "completed" ? "done" : "complete"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskId(subtask.id);
                          setOpenModal(true)
                          // handlerCompleteTask(selectedTask?.id, subtask.id);
                        }}
                      >
                        {task.status === "completed" && <CheckCircle />}
                        <button className="rounded-md flex items-center justify-center">
                          {"Complete"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="noTaskFound">
          <h2 className="font-semibold text-gray-800 mb-0 capitalize">
            No data
          </h2>
        </div>
      )}
    </>
  );

  const renderSkeletonTaskCard = () => (
    <div className="bg-white rounded-lg shadow-sm p-[13px] border border-gray-100">
      <Skeleton height={24} width="80%" className="mb-2" />
      <div className="flex items-center justify-between">
        <Skeleton height={16} width="40%" />
        <Skeleton height={16} width="30%" />
      </div>
    </div>
  );

  const renderSkeletonSubtaskDetails = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-2">
      <div className="p-4">
        <Skeleton height={24} width="100%" className="mb-4" />
        <Skeleton height={16} width="80%" className="mb-2" />
        <Skeleton height={16} width="60%" className="mb-2" />
        <Skeleton height={16} width="70%" className="mb-2" />
        <Skeleton height={36} width="100%" className="mt-4" />
      </div>
    </div>
  );

  return (
    <div className="rounded-xl p-6 bg-white border-r h-[90vh] overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {selectedTask?.title}
          </h1>
        </div>

        <div className="flex gap-8">
          <div className="task-list-inner-cards w-2/3 grid grid-cols-3 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max border-r min-h-[400px] max-h-max border-gray-200 pr-8 overflow-auto">
            {loading
              ? Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index}>{renderSkeletonTaskCard()}</div>
                  ))
              : tasks.map(renderTaskCard)}
          </div>
          <div className="w-1/3">
            {loading ? (
              renderSkeletonSubtaskDetails()
            ) : selectedSubTask ? (
              renderSubtaskDetails(selectedSubTask)
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500 border border-gray-100">
                <ChevronRight className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">
                  Select a task to view details
                </p>
                <p className="text-sm text-gray-400">
                  Click on any task card to see its subtasks and information
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={openModal}
        onAction={() => {handlerCompleteTask(selectedTask?.id, taskId);}}
        onClose={() => {
          setTaskId('');
          setOpenModal(false)
        }}
        title="Confirm"
      >
        <div>Do you want to complete the task?</div>
      </Modal>
    </div>
  );
};

export default TaskList;
