export default function addCustodian() {
    return (
        <div className="bg-green-800 min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto w-[40rem] md:h-screen lg:py-0">
                <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
                    <div className="p-8 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold leading-tight tracking-tight text-green-800 md:text-2xl">
                            Add the Custodian's Credentials
                        </h1>
                        <form className="space-y-4 md:space-y-6" action="#">
                            <div className="flex space-x-4">
                                <div>
                                    <label htmlFor="firstname" className="block mb-2 text-sm font-medium text-green-800">First Name</label>
                                    <input type="text" name="firstname" id="firstname" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="First Name" required />
                                </div>
                                <div>
                                    <label htmlFor="lastname" className="block mb-2 text-sm font-medium text-green-800">Last name</label>
                                    <input type="text" name="lastname" id="lastname" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Last Name" required />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="email" className="block mb-2 text-sm font-medium text-green-800">Email</label>
                                <input type="text" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Email" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block mb-2 text-sm font-medium text-green-800">Phone Number</label>
                                <input type="text" name="phone" id="phone" className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5" placeholder="Phone number" />
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