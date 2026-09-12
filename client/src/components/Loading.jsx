import { Loader2Icon } from 'lucide-react'

const Loading = () => {
    return (
        <div className="h-screen flex justify-center items-center bg-white">
            loading...
            <Loader2Icon size={26} className="animate-spin text-zinc-950" />
        </div>
    );
};

export default Loading;