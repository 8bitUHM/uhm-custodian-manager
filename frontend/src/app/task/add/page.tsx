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
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto w-[40rem] md:h-screen lg:py-0">
                <div className="w-full outline-1  outline-slate-300 outline rounded-lg shadow-xl md:mt-0 sm:max-w-md xl:p-0">
                    <div className="p-8 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-800 md:text-2xl">
                            Add Task
                        </h1>
                        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="title" className="block mb-2 text-sm font-medium text-slate-800">Title</label>
                                <input type="text" name="title" id="title" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Title" />
                            </div>
                            <div>
                                <label htmlFor="description" className="block mb-2 text-sm font-medium text-slate-800">Full Name</label>
                                <textarea name="description" id="description" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Description goes here..." />
                            </div>
                            <div>
                                <label htmlFor="description" className="block mb-2 text-sm font-medium text-slate-800">Full Name</label>
                                <textarea name="description" id="description" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Description goes here..." />
                            </div>
                            <div>
                                <label htmlFor="description" className="block mb-2 text-sm font-medium text-slate-800">Full Name</label>
                                <textarea name="description" id="description" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Description goes here..." />
                            </div>
                            <div>
                                <label htmlFor="description" className="block mb-2 text-sm font-medium text-slate-800">Full Name</label>
                                <textarea name="description" id="description" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Description goes here..." />
                            </div>
                            <div>
                                <label htmlFor="description" className="block mb-2 text-sm font-medium text-slate-800">Full Name</label>
                                <textarea name="description" id="description" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Description goes here..." />
                            </div>
                            <div>
                                <label htmlFor="description" className="block mb-2 text-sm font-medium text-slate-800">Full Name</label>
                                <textarea name="description" id="description" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Description goes here..." />
                            </div>
                            <div>
                                <label htmlFor="description" className="block mb-2 text-sm font-medium text-slate-800">Full Name</label>
                                <textarea name="description" id="description" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Description goes here..." />
                            </div>
                            <button type="submit" className="w-full text-white bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:cursor-progress disabled:bg-red-500 transition-colors duration-200">Create Task</button>

                            <a href="/" className="font-medium text-black text-sm block pt-1 hover:underline">Back to home</a>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}