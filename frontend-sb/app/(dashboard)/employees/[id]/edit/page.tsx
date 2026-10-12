import EmployeeForm from "../../_components/EmployeeForm"
import AssetSection from "../../_components/AssetSection"

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div className="space-y-6"><EmployeeForm id={id} /><AssetSection idKaryawan={id} /></div>
}
