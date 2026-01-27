'use client';

import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

export default function CreateTaskPage() {
    // We create a state object that matches your TaskCreate Pydantic model
    const [task, setTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        building_id: '',
        assigned_to: ''
    });

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        try {
            // Hardcoding the URL as requested
            // Note: Use http://127.0.0.1:8000/api/tasks/ if your backend is local
            await axios.post('http://127.0.0.1:8000/api/tasks/', {
                ...task,
                // Ensure IDs are sent as numbers or null, not empty strings
                building_id: task.building_id ? parseInt(task.building_id) : null,
                assigned_to: task.assigned_to ? parseInt(task.assigned_to) : null,
            });

            toast.success('Task created successfully!');
            setTask({ title: '', description: '', priority: 'medium', building_id: '', assigned_to: '' });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.detail || 'Failed to create task';
                toast.error(message);
            } else {
                // Handle non-axios errors (like a code crash)
                toast.error('An unexpected error occurred');
            }
        }
    };



    return (
        <div className="bg-white min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto w-[40rem] md:h-screen lg:py-0">
                <div className="w-full outline-1  outline-slate-300 outline rounded-lg shadow-xl md:mt-0 sm:max-w-md xl:p-0">
                    <div className="p-8 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-800 md:text-2xl">
                            Add New Task
                        </h1>
                        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="title" className="block mb-2 text-sm font-medium text-slate-800">Title</label>
                                <input type="text" name="title" id="title" value={task.title} onChange={(e) => setTask({...task, title: e.target.value})} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Title" />
                                {/*Possibly change placeholders to an example rather than the same thing as the labels */}
                            </div>
                            <div>
                                <label htmlFor="description" className="block mb-2 text-sm font-medium text-slate-800">Description</label>
                                <input type="text" name="description" id="description" value={task.description} onChange={(e) => setTask({...task, description: e.target.value})} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Description" />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-800">Priority</label>
                                <select 
                                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                                    value={task.priority}
                                    onChange={(e) => setTask({...task, priority: e.target.value})}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-slate-800">Building ID</label>
                                <input 
                                    placeholder="Building ID (Number)" 
                                    type="number"
                                    className="border p-2"
                                    value={task.building_id}
                                    onChange={(e) => setTask({...task, building_id: e.target.value})}
                                />
                            </div>
                            <button type="submit" className="w-full text-white bg-green-700 hover:bg-green-600 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:cursor-progress disabled:bg-red-500 transition-colors duration-200">Save Task</button>
                            <a href="/" className="font-medium text-green-800 text-sm block pt-1 hover:underline">Back to home</a>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}