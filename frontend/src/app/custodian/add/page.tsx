"use client";

import { useState, useEffect } from "react"
import type { Custodian, Supervisor, nameHolder } from "@/lib/types"
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
    const [nameHolder, setNameHolder] = useState<nameHolder>({
        firstName: "",
        lastName: ""
    })
    const [errors, setErrors] = useState({
        firstName: false,
        lastName: false,
        id: false,
        role: false,
        boss: false,
    });
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [showBossDropdown, setShowBossDropdown] = useState(false);

    const { showToast } = useToast()

    const formatName = (name: string) => name.trim().toLowerCase().replace(/^\w/, (char) => char.toUpperCase());

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

    console.log(custodian.name);

    // Resets the 2nd dropdown option
    useEffect(() => {
        setCustodian((prev) => ({
            ...prev,
            boss_name: undefined,
            boss_id: undefined
        }));
    }, [custodian.role]);

    useEffect(() => {
        const first = formatName(nameHolder.firstName);
        const last = formatName(nameHolder.lastName);

        const fullName = first && last ? `${first} ${last}` : first || last || "";

        setCustodian((prev) => ({
            ...prev,
            name: fullName || null,
        }));
    }, [nameHolder.firstName, nameHolder.lastName]);

    // Submits the frontend input onto the backend database
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // If any of the inputs are empty, it is true. If its not empty, it is false
        const errorCheck = {
            firstName: !nameHolder.firstName,
            lastName: !nameHolder.lastName,
            id: !custodian.id,
            role: !custodian.role,

            // If custodian.role is either Janitor II or Janitor III and there is no custodian boss id, it is true. It is false if custodian.role is Supervisor or if there is a custodian boss id
            boss: custodian.role !== "Supervisor" && (custodian.role === "Janitor II" || custodian.role === "Janitor III") && !custodian.boss_id
        };

        setErrors(errorCheck);

        // If at least one boolean in errorCheck object is true, make "hasErrors" true.
        const hasErrors = Object.values(errorCheck).some(Boolean);
        if (hasErrors) {
            showToast("Please fill out required information", "fail");
            return;
        }

        if (custodian.id!.toString().length > 10) {
            setErrors((prev) => ({
                ...prev,
                id: true,
            }));
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
                    setErrors((prev) => ({
                        ...prev,
                        id: true,
                    }));
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
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label htmlFor="firstname" className="block mb-2 text-sm font-medium text-slate-800">First Name</label>
                                    <input type="text" id="firstName" value={nameHolder.firstName} onChange={(e) => { setNameHolder({ ...nameHolder, firstName: e.target.value }); setErrors((prev) => ({ ...prev, firstName: false })); }} className={`bg-gray-50 border text-gray-900 rounded-lg block w-full p-2.5 ${errors.firstName ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-primary-600 focus:border-primary-600"}`} placeholder="First Name" />
                                </div>

                                <div className="flex-1">
                                    <label htmlFor="lastname" className="block mb-2 text-sm font-medium text-slate-800">Last Name</label>
                                    <input type="text" id="lastname" value={nameHolder.lastName} onChange={(e) => { setNameHolder({ ...nameHolder, lastName: e.target.value }); setErrors((prev) => ({ ...prev, lastName: false })); }} className={`bg-gray-50 border text-gray-900 rounded-lg block w-full p-2.5 ${errors.lastName ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-primary-600 focus:border-primary-600"}`} placeholder="Last Name" />
                                </div>
                            </div>

                            {/* <div>
                                <label htmlFor="name" className="block mb-2 text-sm font-medium text-slate-800">Full Name</label>
                                <input type="text" name="name" id="name" value={custodian.name || ""} onChange={(e) => setCustodian({ ...custodian, name: e.target.value === "" ? null : e.target.value })} className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Full Name" />
                            </div> */}

                            <div>
                                <label htmlFor="id" className="block mb-2 text-sm font-medium text-slate-800">ID Number</label>
                                <input type="text" name="id" id="id" value={custodian.id || ""} onChange={(e) => { setCustodian({ ...custodian, id: Number(e.target.value) }); setErrors((prev) => ({ ...prev, id: false })); }} className={`bg-gray-50 border text-gray-900 rounded-lg block w-full p-2.5 ${errors.id ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300 focus:ring-primary-600 focus:border-primary-600"}`} placeholder="ID Number" />
                            </div>
                            <div>
                                <label htmlFor="role" className="block mb-2 text-sm font-medium text-green-800">Custodian Role</label>
                                <div className="relative inline-block w-full">
                                    <button type="button" onClick={() => setShowRoleDropdown(!showRoleDropdown)} className={`text-white font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-between items-center w-full ${errors.role ? "ring-2 ring-red-500 bg-green-700" : "bg-green-700 hover:bg-green-600"} `}>
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
                                                            setErrors((prev) => ({ ...prev, role: false }));
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
                                    <button type="button" onClick={() => setShowBossDropdown(!showBossDropdown)} className={`text-white font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-between items-center w-full ${errors.boss ? "ring-2 ring-red-500 bg-green-700" : "bg-green-700 hover:bg-green-600"} `}>
                                        {custodian.boss_name || "Select name"}
                                        <svg className="w-2.5 h-2.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                        </svg>
                                    </button>

                                    {showBossDropdown && (
                                        <div className="absolute z-10 mt-2 w-full bg-white divide-y divide-gray-100 rounded-lg shadow">
                                            <ul className="py-2 text-sm text-green-900 max-h-56 overflow-y-auto">
                                                {supervisors.map((supervisor) => (
                                                    <li key={supervisor.id}>
                                                        <button type="button" onClick={() => {
                                                            setCustodian({ ...custodian, boss_name: supervisor.name, boss_id: supervisor.id });
                                                            setErrors((prev) => ({ ...prev, boss: false }));
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