"use client";

import { useState, useEffect } from "react"
import type { Custodian, Supervisor, nameHolder } from "@/lib/types"
import { useToast } from "@/app/components/Toast"
import axios from "axios"

export default function addCustodian() {

    const [custodian, setCustodian] = useState<Custodian>({
        firstName: "",
        lastName: "",
        id: undefined,
        role: undefined,
        boss_name: undefined,
        boss_id: undefined,
        groupnum: undefined,
    });

    const [errors, setErrors] = useState({
        firstName: false,
        lastName: false,
        id: false,
        role: false,
        boss: false,
        groupnum: false,
    });
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [showBossDropdown, setShowBossDropdown] = useState(false);
    const [showGroupnumDropdown, setShowGroupnumDropdown] = useState(false);

    const { showToast } = useToast()

    const listgroupnums = Array.from({ length: 20 }, (_, i) => i + 1);

    // The line below helps make the first character of the name uppercase and everything else lowercase.
    const formatName = (name: string) => name.trim().toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
    const NAME_REGEX = /^[A-Za-z\s'-]+$/;

    // Changes the classname of the input tag based on if they filled the information incorrectly
    const inputClass = (errorCheck: boolean) =>
        `bg-gray-50 border text-gray-900 rounded-lg block w-full p-2.5 ${errorCheck
            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
            : "border-gray-300 focus:ring-primary-600 focus:border-primary-600"
        }`;

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
            boss_id: undefined,
            groupnum: undefined,
        }));
    }, [custodian.role]);

    // Submits the frontend input onto the backend database
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // If any of the inputs are empty, it is true. If its not empty, it is false
        const errorCheck = {
            firstName: !custodian.firstName,
            lastName: !custodian.lastName,
            id: !custodian.id,
            role: !custodian.role,
            groupnum: !custodian.groupnum,

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

        // If custodian.id is not 7-8 numbers
        if (custodian.id!.toString().length > 8 || custodian.id!.toString().length < 7) {
            setErrors((prev) => ({
                ...prev,
                id: true,
            }));
            showToast("ID must be 7-8 digits", "fail");
            return;
        }

        // If first or last name has any numbers or special characters in it (excluding - and ')
        if (!NAME_REGEX.test(custodian.firstName) || !NAME_REGEX.test(custodian.lastName)) {
            setErrors((prev) => ({
                ...prev,
                firstName: !NAME_REGEX.test(custodian.firstName),
                lastName: !NAME_REGEX.test(custodian.lastName),
            }));
            showToast("First and Last names may only contain letters, spaces, apostrophes, and hyphens", "fail");
            return;
        }

        let endpoint = "";
        let custData: Record<string, any> = {
            name: `${formatName(custodian.firstName)} ${formatName(custodian.lastName)}`.trim(),
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
                custData.groupnum = custodian.groupnum;
                break;
            case "Janitor II":
                endpoint = "http://localhost:8000/api/j2s/";
                custData.j3_id = custodian.boss_id;
                custData.groupnum = custodian.groupnum;
                break;
            default:
                showToast("Please select a role", "fail");
                return;
        }

        // Submits the data
        try {
            const { data } = await axios.post(endpoint, custData);
            showToast(`Successfully added ${custData.name}`, 'success');
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
            <div className="flex items-center justify-center w-full">
                <div className="mx-auto">
                    <div className="p-8">
                        <h1 className="text-xl font-bold leading-loose tracking-tight text-slate-800">
                            Add Custodian
                        </h1>
                        <form className="flex flex-col min-h-full gap-4" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-4">
                                <div className="inline-flex flex-row justify-between gap-3 lg:items-stretch lg:w-[50rem] lg:gap-0">
                                    <div className="basis-[18rem]">
                                        <label htmlFor="firstname" className="block mb-2 text-sm font-medium text-slate-800">First Name</label>
                                        <input type="text" name="firstname" value={custodian.firstName} id="firstname" onChange={(e) => { setCustodian({ ...custodian, firstName: e.target.value }); setErrors((prev) => ({ ...prev, firstName: false })); }} className={inputClass(errors.firstName)} placeholder="First Name" />
                                    </div>
                                    <div className="basis-[18rem]">
                                        <label htmlFor="lastname" className="block mb-2 text-sm font-medium text-slate-800">Last Name</label>
                                        <input type="text" name="lastname" value={custodian.lastName} id="lastname" onChange={(e) => { setCustodian({ ...custodian, lastName: e.target.value }); setErrors((prev) => ({ ...prev, lastName: false })); }} className={inputClass(errors.lastName)} placeholder="Last Name" />
                                    </div>
                                    <div className="basis-[8rem]">
                                        <label htmlFor="id" className="block mb-2 text-sm font-medium text-slate-800">ID Number</label>
                                        <input
                                            type="text"
                                            name="id"
                                            id="id"
                                            value={custodian.id || ""}
                                            onChange={(e) => { setCustodian({ ...custodian, id: Number(e.target.value) }); setErrors((prev) => ({ ...prev, id: false })); }}
                                            className={inputClass(errors.id)}
                                            placeholder="ID Number"
                                        />
                                    </div>
                                </div>

                                {/* The dropdown is a little too big. need to make this. Could make supervisor's name and group number on the same row. */}
                                <div className="inline-flex flex-row justify-between gap-3 lg:items-stretch lg:w-[50rem] lg:gap-0">
                                    <div className="basis-[50rem] relative">
                                        <label htmlFor="role" className="block mb-2 text-sm font-medium text-slate-800">Custodian Role</label>

                                        <button
                                            type="button"
                                            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                                            className={`text-white font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-between items-center w-full ${errors.role ? "ring-2 ring-red-500 bg-green-600" : "bg-green-600 hover:bg-green-700"} `}
                                        >
                                            {custodian.role || "Select role"}
                                            <svg className="w-2.5 h-2.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                            </svg>
                                        </button>

                                        {showRoleDropdown && (
                                            <div className="absolute left-0 z-20 mt-2 w-full bg-white divide-y divide-gray-100 rounded-lg shadow">
                                                <ul className="py-2 text-sm text-slate-900">
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
                            </div>
                            {(custodian.role === "Janitor II" || custodian.role === "Janitor III") && (
                                <div className="inline-flex flex-row justify-between gap-3 lg:items-stretch lg:w-[50rem] lg:gap-0">
                                    <div className="basis-[35rem] relative">
                                        <label htmlFor="custodianboss" className="block mb-2 text-sm font-medium text-slate-800">{custodian.role === "Janitor III" ? "Supervisor's Name" : "J3's Name"}</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowBossDropdown(!showBossDropdown)}
                                            className={`text-white font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-between items-center w-full ${errors.boss ? "ring-2 ring-red-500 bg-green-600" : "bg-green-600 hover:bg-green-700"} `}
                                        >
                                            {custodian.boss_name || "Select name"}
                                            <svg className="w-2.5 h-2.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                            </svg>
                                        </button>

                                        {showBossDropdown && (
                                            <div className="absolute left-0 z-10 mt-2 w-full bg-white divide-y divide-gray-100 rounded-lg shadow">
                                                <ul className="py-2 text-sm text-slate-900 max-h-56 overflow-y-auto">
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

                                    <div className="basis-[10rem] relative">
                                        <label htmlFor="groupnum" className="block mb-2 text-sm font-medium text-slate-800">Select Group Number</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowGroupnumDropdown(!showGroupnumDropdown)}
                                            className={`text-white font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-between items-center w-full bg-green-600 hover:bg-green-700 ${errors.groupnum ? "ring-2 ring-red-500 bg-green-600" : "bg-green-600 hover:bg-green-700"}`}
                                        >
                                            {custodian.groupnum || "Group #"}
                                            <svg className="w-2.5 h-2.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                            </svg>
                                        </button>

                                        {showGroupnumDropdown && (
                                            <div className="absolute left-0 z-10 mt-2 w-full bg-white divide-y divide-gray-100 rounded-lg shadow">
                                                <ul className="py-2 text-sm text-slate-900 max-h-56 overflow-y-auto">
                                                    {listgroupnums.map((num) => (
                                                        <li key={num}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCustodian({ ...custodian, groupnum: num });
                                                                    setErrors((prev) => ({ ...prev, groupnum: false }));
                                                                    setShowGroupnumDropdown(false);
                                                                }}
                                                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                                            >
                                                                {num}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <button type="submit" className="w-[10rem] text-white bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:cursor-progress disabled:bg-red-500 transition-colors duration-200">Add Custodian</button>

                            <a href="/" className="font-medium text-black text-sm block pt-1 hover:underline">Back to home</a>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}