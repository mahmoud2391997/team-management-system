'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getEmployees, getTasks } from '@/lib/actions/data-actions'
import { isError } from '@/lib/utils/async-helpers'
import { ArrowLeft, Shield, Calendar, DollarSign, Briefcase, User, CheckCircle } from 'lucide-react'

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empResult, tasksResult] = await Promise.all([
          getEmployees(),
          getTasks(),
        ])

        if (!isError(empResult)) {
          const found = empResult.data.find((e: any) => e.id === params.id)
          if (found) {
            setEmployee(found)
          } else {
            router.push('/employees')
          }
        }

        if (!isError(tasksResult)) {
          const employeeTasks = tasksResult.data.filter((t: any) => t.assignee_id === params.id)
          setTasks(employeeTasks)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="p-8">
        <Link href="/employees">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
        </Link>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Employee not found</p>
        </Card>
      </div>
    )
  }

  const profile = employee.profile
  const department = employee.department
  const manager = employee.manager
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const assignedTasks = tasks.length

  return (
    <div className="p-8 space-y-8">
      <Link href="/employees">
        <Button variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Employees
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {profile?.first_name?.[0] || '?'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {profile?.first_name} {profile?.last_name}
                    </h1>
                    <p className="text-muted-foreground">{profile?.email}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        employee.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : employee.status === 'ON_LEAVE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm">Position</span>
                  </div>
                  <p className="text-lg font-medium">{employee.position || 'Not specified'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Role</span>
                  </div>
                  <p className="text-lg font-medium">{profile?.role || 'Not assigned'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Salary</span>
                  </div>
                  <p className="text-lg font-medium">
                    {employee.salary ? `$${employee.salary.toLocaleString()}` : 'Not specified'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Join Date</span>
                  </div>
                  <p className="text-lg font-medium">
                    {employee.join_date ? new Date(employee.join_date).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department & Management */}
          <Card>
            <CardHeader>
              <CardTitle>Department & Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="text-lg font-medium">{department?.name || 'Not assigned'}</p>
              </div>
              {manager && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Manager</p>
                  <p className="text-lg font-medium">
                    {manager.first_name || manager.last_name
                      ? `${manager.first_name || ''} ${manager.last_name || ''}`.trim()
                      : manager.email || 'Not assigned'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Tasks ({assignedTasks})</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tasks assigned yet</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded font-semibold ${
                              task.priority === 'URGENT' ? 'bg-red-100 text-red-800'
                              : task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800'
                              : task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded font-semibold ${
                              task.status === 'COMPLETED' ? 'bg-green-100 text-green-800'
                              : task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800'
                              : task.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                        {task.status === 'COMPLETED' && (
                          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Assigned</span>
                  <span className="text-2xl font-bold">{assignedTasks}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="text-2xl font-bold text-green-600">{completedTasks}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="text-2xl font-bold text-yellow-600">{assignedTasks - completedTasks}</span>
                </div>
              </div>
              {assignedTasks > 0 && (
                <>
                  <div className="w-full bg-muted rounded-full h-2 mt-4">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(completedTasks / assignedTasks) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {Math.round((completedTasks / assignedTasks) * 100)}% Complete
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/employees" className="block">
                <Button variant="outline" className="w-full">
                  Back to List
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
