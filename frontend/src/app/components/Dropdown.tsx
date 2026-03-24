import { LucideProps } from 'lucide-react';
import { ReactElement, useState } from 'react';

type DropdownProps = {
    id: string,
    name: string,
    values: string[],
    className: string,
    icon: ReactElement<LucideProps>,
};

export const Dropdown = ({id, name, values, className, icon}:DropdownProps) => {

    const [searchString, setSearchString] = useState<string>('');
    
    return(
        <div className={`${className}`}>
            <label htmlFor={name}>{name}</label>
            <div className="flex items-center border border-gray-300 rounded-lg focus-within:outline group relative">
                <div className="text-gray-500 bg-gray-300 flex self-stretch items-center justify-center w-10 rounded-l-md">
                    {icon}
                </div>

                <input
                    id={`search_${id}_box`}
                    type="text"
                    className="p-2.5 outline-none text-gray-900 bg-transparent"
                    onChange={(event) => setSearchString(event.currentTarget.value)}
                />

                <ul id={`${id}_values`} className="absolute h-[6rem] w-1/2 p-2 items-start border border-black rounded-lg hidden bg-white group-focus-within:flex  group-focus-within:flex-col inset-y-full mt-3 overflow-y-scroll">
                    {
                        values
                        .filter((val) => searchString == '' ? values : val.match(new RegExp(searchString, 'gi')))
                        .map((val, index) => <button type="button" key={index} value={val}>{val}</button>)
                    }
                </ul>
            </div>
        </div>
    );
}