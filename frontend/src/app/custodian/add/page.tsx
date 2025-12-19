"use client";

import { useState } from "react"
import type { Supervisor } from "@/lib/types"
import { useToast } from "@/app/components/Toast";

export default function addCustodian() {

    const [janitor, setJanitor] = useState<Supervisor>({
        name: undefined,
        id: undefined,
    });

    const { showToast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!janitor.name || !janitor.id) {
            showToast("Please fill out required information", "fail");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/supervisors/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(janitor),
            });

            if (!response.ok) {
                throw new Error("Failed to create supervisor");
            }

            const data = await response.json();
            showToast("Custodian Added Successfully", "success");
            console.log("Created supervisor:", data);
        } catch (error) {
            console.error(error);
            showToast("ID already exists", "fail");
        }
    }

    return (
        <div className="bg-green-800 min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto w-[40rem] md:h-screen lg:py-0">
                <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
                    <div className="p-8 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold leading-tight tracking-tight text-green-800 md:text-2xl">
                            Add the Custodian's Credentials
                        </h1>
                        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="firstname" className="block mb-2 text-sm font-medium text-green-800">Full Name</label>
                                <input type="text" name="firstname" id="firstname" value={janitor.name} onChange={(e) => setJanitor({ ...janitor, name: e.target.value })} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Full Name" />
                            </div>
                            <div>
                                <label htmlFor="id" className="block mb-2 text-sm font-medium text-green-800">ID Number</label>
                                <input type="text" name="id" id="id" value={janitor.id || ""} onChange={(e) => setJanitor({ ...janitor, id: Number(e.target.value) })} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="ID Number" />
                            </div>
                            <div>
                                <label htmlFor="janitorrole" className="block mb-2 text-sm font-medium text-green-800">Janitor Role</label>
                                <input type="text" name="janitorrole" id="janitorrole" value="Supervisor" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Janitor Role" readOnly />
                            </div>
                            <button type="submit" className="w-full text-white bg-green-800 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:cursor-progress disabled:bg-red-500">Add Custodian</button>

                            <a href="/" className="font-medium text-green-800 text-sm block hover:underline">Back to home</a>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}