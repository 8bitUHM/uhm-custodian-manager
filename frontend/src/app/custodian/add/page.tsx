"use client";

import { useState } from "react"
import type { Custodian } from "@/lib/types"
import { useToast } from "@/app/components/Toast"
import axios from "axios"

export default function addCustodian() {

    const [custodian, setCustodian] = useState<Custodian>({
        name: "",
        id: undefined,
        role: undefined,
        boss_id: undefined
    });
    const [showDropdown, setShowDropdown] = useState(false);

    const { showToast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!custodian.name || !custodian.id) {
            showToast("Please fill out required information", "fail");
            return;
        }

        try {
            const { data } = await axios.post(
                "http://localhost:8000/api/supervisors/",
                {
                    name: custodian.name,
                    id: custodian.id
                },
            );
            console.log(custodian)
            showToast(`Successfully added ${custodian.name}`, 'success');
        } catch (error) {
            console.error(error);
            showToast(`${error}`, 'fail');
        }

        // Use as reference when converting from fetch to axios
        // 
        //     try {
        //         const response = await fetch("http://localhost:8000/api/supervisors/", {
        //             method: "POST",
        //             headers: {
        //                 "Content-Type": "application/json",
        //             },
        //             body: JSON.stringify(custodian),
        //         });

        //         if (!response.ok) {
        //             throw new Error("Failed to create supervisor");
        //         }

        //         const data = await response.json();
        //         showToast("Custodian Added Successfully", "success");
        //         console.log("Created supervisor:", data);
        //     } catch (error) {
        //         console.error(error);
        //         showToast("ID already exists", "fail");
        //     }
        // }
    }
    return (
        <div className="bg-white min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto w-[40rem] md:h-screen lg:py-0">
                <div className="w-full outline-1  outline-slate-300 outline rounded-lg shadow-xl md:mt-0 sm:max-w-md xl:p-0">
                    <div className="p-8 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-800 md:text-2xl">
                            Add Custodian
                        </h1>
                        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="firstname" className="block mb-2 text-sm font-medium text-slate-800">Full Name</label>
                                <input type="text" name="firstname" id="firstname" value={custodian.name || ""} onChange={(e) => setCustodian({ ...custodian, name: e.target.value === "" ? null : e.target.value })} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Full Name" />
                            </div>
                            <div>
                                <label htmlFor="id" className="block mb-2 text-sm font-medium text-slate-800">ID Number</label>
                                <input type="text" name="id" id="id" value={custodian.id || ""} onChange={(e) => setCustodian({ ...custodian, id: Number(e.target.value) })} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="ID Number" />
                            </div>
                            <div>
                                <label htmlFor="role" className="block mb-2 text-sm font-medium text-green-800">Custodian Role</label>
                                <div className="relative inline-block w-full">
                                    <button type="button" onClick={() => setShowDropdown(!showDropdown)} className="text-white bg-green-900 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-left inline-flex justify-between items-center w-full">
                                        {custodian.role || "Select role"}
                                        <svg className="w-2.5 h-2.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                        </svg>
                                    </button>

                                    {showDropdown && (
                                        <div className="absolute z-10 mt-2 w-full bg-white divide-y divide-gray-100 rounded-lg shadow">
                                            <ul className="py-2 text-sm text-green-900">
                                                {["Supervisor", "Janitor III", "Janitor II"].map((role) => (
                                                    <li key={role}>
                                                        <button type="button" onClick={() => {
                                                            setCustodian({ ...custodian, role });
                                                            setShowDropdown(false);
                                                        }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                                        >
                                                            {role}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {(custodian.role === "Janitor II" || custodian.role === "Janitor III") && (
                                <div>
                                    <label htmlFor="custodianboss" className="block mb-2 text-sm font-medium text-green-800">Custodian's Boss ID</label>
                                    <input type="text" name="custodianboss" id="custodianboss" value={custodian.name || ""} onChange={(e) => setCustodian({ ...custodian, name: e.target.value })} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Full Name" />
                                </div>
                            )}
                            <button type="submit" className="w-full text-white bg-green-700 hover:bg-green-600 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:cursor-progress disabled:bg-red-500 transition-colors duration-200">Add Custodian</button>

                            <a href="/" className="font-medium text-green-800 text-sm block pt-1 hover:underline">Back to home</a>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}