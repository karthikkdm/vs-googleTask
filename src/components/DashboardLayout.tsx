import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  LogOut,
} from "lucide-react";
import TaskList from "./Task/TaskList.tsx";
import { gapi } from "gapi-script";
import './Task/task.css';
import { ToastContainer } from 'react-toastify';

interface Task {
  id: string;
  title: string;
  updated:string;
}

const DashboardLayout: React.FC = () => {
  const clientId =  "830735989734-bhku50l8hsj0bj0d88rgto3sggk75iqg.apps.googleusercontent.com" ;
  const scope = "https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/tasks.readonly";

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<{}>({});
  const [taskListHeader, setTaskListHeader] = useState<Task[]>([]);

  useEffect(() => {
    const initializeGapiClient = async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          gapi.load('client:auth2', {
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
        setIsAuthenticated(authInstance.isSignedIn.get())
      } catch (error) {
        console.error('Error initializing GAPI:', error);
      }
    };

    initializeGapiClient();
  }, []);


  useEffect(()=>{
    if(isAuthenticated && authToken){
      fetchTasks(authToken)
    }
  },[isAuthenticated])

  const fetchTasks = async (authToken: string | null) => {
    try {
      const tokenObject = gapi.client.getToken();
      console.log("gapi.client.getToken()", tokenObject);
      const response = await fetch(
        "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
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
        setTaskListHeader(data.items || []);
      } else {
        setTaskListHeader([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
    }
  };


  return (
    <div className="flex h-screen">
      <div className="w-[231px] bg-white border-r h-full overflow-y-auto">
        <div className="p-4 task-manager logoutIcon">
          <h1 className="text-2xl font-semibold">Task Manager</h1>
        <LogOut className="ml-2 mt-1" />
        </div>
        <nav>
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 task-section">
            {taskListHeader.map((task) => (
              <div
                key={task.id}
                className={`task-card px-4 py-2 overflow-hidden transition-all duration-200 ease-in-out transform hover:scale-105 ${
                  selectedTask?.id === task.id ? "card-active" : ""
                }`}
              >
                <button
                  className="w-full h-full p-[7px] text-left focus:outline-none p-0"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-center justify-between">
                  <div className="flex items-center justify-start gap-2 tick-div">
                    <CheckCircle
                      className={`w-5 h-5 ${
                        selectedTask === task.id
                          ? "text-blue-500"
                          : "text-gray-400"
                      }`}
                    />
                    <span className="text-sm font-bold text-gray-800">
                      {task.title}
                    </span></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right w-4 h-4 mr-1 text-blue-500"><path d="m9 18 6-6-6-6"></path></svg>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </nav>
      </div>
      <ToastContainer/>
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {selectedTask && (
            <TaskList
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
