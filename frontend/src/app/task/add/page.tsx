"use client";
// bg-orange-500

import { useState } from "react"
import { Task } from "@/lib/types"
import { useToast } from "@/app/components/Toast"
import axios from "axios"

export default function addTask() {

    const { showToast } = useToast();

    const [task, setTask] = useState<Task>();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    }

    return (
        <div className="bg-white min-h-screen flex items-center justify-center">
            <div className="flex items-center justify-center w-full">
                <div className="mx-auto">
                    <div className="p-8">
                        <h1 className="text-xl font-bold leading-loose tracking-tight text-slate-800">
                            Schedule Task
                        </h1>
                        <form className="flex flex-col min-h-full gap-4" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-4">
                                <div className="inline-flex flex-row justify-between gap-3 lg:items-stretch lg:w-[50rem] lg:gap-0">
                                    <div className="basis-[30rem]">
                                        <label htmlFor="title" className="block mb-2 text-sm font-medium text-slate-800">Title</label>
                                        <input type="text" name="title" id="title" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Title" />
                                    </div>
                                    <div>
                                        {/* Change: Dropdown */}
                                        <label htmlFor="building_id" className="block mb-2 text-sm font-medium text-slate-800">Building</label>
                                        <input type="text" name="building_id" id="building_id" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"/>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="description" className="block mb-2 text-sm font-medium text-slate-800">Description</label>
                                    <textarea 
                                        name="description" 
                                        id="description" 
                                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" 
                                        placeholder="Description goes here..." 
                                        rows={5}/>
                                </div>
                            </div>
                            <div className="inline-flex w-full justify-between gap-px lg:gap-0">
                                <div>
                                    <label htmlFor="status" className="block mb-2 text-sm font-medium text-slate-800">Status</label>
                                    {/* Change: Dropdown */}
                                    <input type="text" name="status" id="status" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"/>
                                </div>
                                <div>
                                    {/* Change: Dropdown */}
                                    <label htmlFor="priority" className="block mb-2 text-sm font-medium text-slate-800">Priority</label>
                                    <input type="text" name="priority" id="priority" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"/>
                                </div>
                                <div>
                                    {/* Change: Dropdown */}
                                    <label htmlFor="assigned_to" className="block mb-2 text-sm font-medium text-slate-800">Assigned To</label>
                                    <input type="text" name="assigned_to" id="assigned_to" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    {/* Change: Date */}
                                    <label htmlFor="scheduled_date" className="block mb-2 text-sm font-medium text-slate-800">Scheduled Date</label>
                                    <input type="date" name="scheduled_date" id="scheduled_date" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Description goes here..." />
                                </div>
                                <div>
                                    {/* Change: Date */}
                                    <label htmlFor="completed_date" className="block mb-2 text-sm font-medium text-slate-800">Completed Date</label>
                                    <input type="date" name="completed_date" id="completed_date" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Description goes here..." />
                                </div>
                            </div>
                            <button type="submit" className="w-[10rem] text-white bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:cursor-progress disabled:bg-red-500 transition-colors duration-200">Create Task</button>

                            <a href="/" className="font-medium text-black text-sm block pt-1 hover:underline">Back to home</a>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}