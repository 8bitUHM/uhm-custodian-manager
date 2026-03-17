import { LucideProps } from 'lucide-react';
import { ReactElement } from 'react';

type DropdownProps = {
    id: string,
    name: string,
    values: string[],
    className: string,
    icon: ReactElement<LucideProps>,
};

export const Dropdown = ({id, name, values, className, icon}:DropdownProps) => {
    
    return(
        <div className={`${className}`}>
            <label htmlFor={name}>{name}</label>
            <div className="flex items-center border border-gray-300 rounded-lg focus-within:outline overflow-hidden">
                <div className="text-gray-500 bg-gray-300 flex self-stretch items-center justify-center w-10">
                    {icon}
                </div>

                {/* Input field (border removed so the container acts as the border) */}
                <input
                    id={id}
                    type="text"
                    className="p-2.5 outline-none text-gray-900 bg-transparent"
                />
            </div>
        </div>
    );
}