import Sidebar from "@/components/sections/admin/Sidebar";
import RoleProtection from "@utils/RoleProtection"; 
import { BranchProvider } from "@/contexts/BranchContext";

const layout = ({children})=>{
    return(
    <RoleProtection allowedRoles={['ADMIN']}>
      <BranchProvider>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar />
          {/* Main Content */}
          <main className="flex-1 px-3 pb-3 bg-gray-50 h-screen overflow-y-auto">
            {children}
          </main>
        </div>
      </BranchProvider>
     </RoleProtection>
    )
}

export default layout;