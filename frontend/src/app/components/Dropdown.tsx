import { ChevronUpCircle, ChevronDownCircle, Search } from 'lucide-react';

type dropdownProps = {
    id: string,
    name: string,
    values: string[],
    className: string,
};

export const Dropdown = ({id, name, values, className}:dropdownProps) => {
    
    return(
        <div className={`${className} relative`}>
            <label htmlFor={name}>{name}</label>
            <input
                id={`search_${id}_box`}
                className="border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
            />
        </div>
    );
}