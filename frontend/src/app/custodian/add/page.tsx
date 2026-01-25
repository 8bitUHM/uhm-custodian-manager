"use client";

import { useState, useEffect } from "react"
import type { Custodian, Supervisor } from "@/lib/types"
import { useToast } from "@/app/components/Toast"
import axios from "axios"

export default function addCustodian() {

    const [custodian, setCustodian] = useState<Custodian>({
        name: "",
        id: undefined,
        role: undefined,
        boss_name: undefined,
        boss_id: undefined
    });
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [showBossDropdown, setShowBossDropdown] = useState(false);

    const { showToast } = useToast()

    // Fetches either the supervisor's api or the j3's api to access their data depending on the custodian role chosen
    useEffect(() => {
        const bossOptions = async () => {
            if (custodian.role !== "Janitor II" && custodian.role !== "Janitor III") {
                setSupervisors([]);
                return;
            }

            const endpoint = custodian.role === "Janitor III" ? "http://localhost:8000/api/supervisors/" : "http://localhost:8000/api/j3s/";

            try {
                const { data } = await axios.get<Supervisor[]>(endpoint);
                setSupervisors(data);
            } catch (error) {
                console.error(error);
                showToast("Failed to load supervisors", "fail");
            }
        };

        bossOptions();
    }, [custodian.role, showToast]);

    // Resets the 2nd dropdown option
    useEffect(() => {
        setCustodian((prev) => ({
            ...prev,
            boss_name: undefined,
            boss_id: undefined
        }));
    }, [custodian.role]);

    // Submits the frontend input onto the backend database
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Error case handling
        if (!custodian.name || !custodian.id || !custodian.role) {
            showToast("Please fill out required information", "fail");
            return;
        }
        if (custodian.role != "Supervisor" && !custodian.boss_id) {
            showToast("Please fill out required information", "fail");
            return;
        }
        if (custodian.id.toString().length > 10) {
            showToast("ID must be 10 digits or fewer", "fail");
            return;
        }

        let endpoint = "";
        let custData: Record<string, any> = {
            name: custodian.name,
            id: custodian.id,
        }

        // Chooses which api to fetch and send data to based on custodian.role
        switch (custodian.role) {
            case "Supervisor":
                endpoint = "http://localhost:8000/api/supervisors/";
                break;
            case "Janitor III":
                endpoint = "http://localhost:8000/api/j3s/";
                custData.supervisor_id = custodian.boss_id;
                break;
            case "Janitor II":
                endpoint = "http://localhost:8000/api/j2s/";
                custData.j3_id = custodian.boss_id;
                break;
            default:
                showToast("Please select a role", "fail");
                return;
        }

        // Submits the data
        try {
            const { data } = await axios.post(endpoint, custData);
            showToast(`Successfully added ${custodian.name}`, 'success');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    showToast("ID already exists", "fail");
                } else {
                    showToast("An unexpected error occurred", "fail");
                }
            } else {
                showToast("An unexpected error occurred", "fail");
            }
        }
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
                                    <button type="button" onClick={() => setShowRoleDropdown(!showRoleDropdown)} className="text-white bg-green-700 hover:bg-green-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-left inline-flex justify-between items-center w-full">
                                        {custodian.role || "Select role"}
                                        <svg className="w-2.5 h-2.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                        </svg>
                                    </button>

                                    {showRoleDropdown && (
                                        <div className="absolute z-20 mt-2 w-full bg-white divide-y divide-gray-100 rounded-lg shadow">
                                            <ul className="py-2 text-sm text-green-900">
                                                {["Supervisor", "Janitor III", "Janitor II"].map((role) => (
                                                    <li key={role}>
                                                        <button type="button" onClick={() => {
                                                            setCustodian({ ...custodian, role });
                                                            setShowRoleDropdown(false);
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
                                <div className="relative inline-block w-full">
                                    <label htmlFor="custodianboss" className="block mb-2 text-sm font-medium text-green-800">{custodian.role === "Janitor III" ? "Supervisor's Name" : "J3's Name"}</label>
                                    <button type="button" onClick={() => setShowBossDropdown(!showBossDropdown)} className="text-white bg-green-700 hover:bg-green-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-left inline-flex justify-between items-center w-full">
                                        {custodian.boss_name || "Select name"}
                                        <svg className="w-2.5 h-2.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                        </svg>
                                    </button>

                                    {showBossDropdown && (
                                        <div className="absolute z-10 mt-2 w-full bg-white divide-y divide-gray-100 rounded-lg shadow">
                                            <ul className="py-2 text-sm text-green-900">
                                                {supervisors.map((supervisor) => (
                                                    <li key={supervisor.id}>
                                                        <button type="button" onClick={() => {
                                                            setCustodian({ ...custodian, boss_name: supervisor.name, boss_id: supervisor.id });
                                                            setShowBossDropdown(false);
                                                        }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                                        >
                                                            {supervisor.name}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
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