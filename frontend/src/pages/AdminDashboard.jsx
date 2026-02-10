import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { propertyAPI, favoritesAPI } from '../lib/api.js';
import Button from '../components/common/Button.jsx';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [reports, setReports] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('User Object:', user);
    if (!user?.is_staff && user?.username !== 'admin') {
      console.log('Access Denied: Admins Only');
      return;
    }
    const fetchData = async () => {
      try {
        const usersData = await favoritesAPI.getUsers();
        console.log('Users Fetched:', usersData);
        setUsers(usersData);

        const propertiesData = await propertyAPI.getProperties();
        console.log('Properties Fetched:', propertiesData);
        setProperties(propertiesData);

        const reportsData = await favoritesAPI.getReports();
        console.log('Reports Fetched:', reportsData);
        setReports(reportsData);
      } catch (err) {
        console.error('Fetch Data Error:', err.message);
        setError('Failed to load dashboard data: ' + err.message);
      }
    };
    fetchData();
  }, [user]);

  const handleApproveProperty = async (id) => {
    try {
      await propertyAPI.updateProperty(id, { is_approved: true });
      setProperties(properties.map(p => p.id === id ? { ...p, is_approved: true } : p));
      console.log(`Property ${id} approved`);
    } catch (err) {
      console.error('Approve Property Error:', err.message);
      setError('Failed to approve property: ' + err.message);
    }
  };

  const handleVerifyUser = async (id) => {
    try {
      await favoritesAPI.verifyUser(id);
      setUsers(users.map(u => u.id === id ? { ...u, profile: { ...u.profile, is_verified: true } } : u));
      console.log(`User ${id} verified`);
    } catch (err) {
      console.error('Verify User Error:', err.message);
      setError('Failed to verify user: ' + err.message);
    }
  };

  const handleBanUser = async (id) => {
    try {
      await favoritesAPI.banUser(id);
      setUsers(users.filter(u => u.id !== id));
      console.log(`User ${id} banned`);
    } catch (err) {
      console.error('Ban User Error:', err.message);
      setError('Failed to ban user: ' + err.message);
    }
  };

  if (!user?.is_staff && user?.username !== 'admin') {
    console.log('Access Denied: Admins Only');
    return <div className="text-center text-red-500">Access Denied: Admins Only</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Lehao Admin Dashboard</h1>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <table className="table-auto w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Username</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Landlord</th>
              <th className="border p-2">Verified</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="border p-2">{u.id}</td>
                <td className="border p-2">{u.username}</td>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2">{u.profile.is_landlord ? 'Yes' : 'No'}</td>
                <td className="border p-2">{u.profile.is_verified ? 'Yes' : 'No'}</td>
                <td className="border p-2">
                  <Button className="mr-2" onClick={() => handleVerifyUser(u.id)}>Verify</Button>
                  <Button className="bg-red-500" onClick={() => handleBanUser(u.id)}>Ban</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Properties</h2>
        <table className="table-auto w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Area</th>
              <th className="border p-2">Landlord</th>
              <th className="border p-2">Approved</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="border p-2">{p.id}</td>
                <td className="border p-2">{p.area}</td>
                <td className="border p-2">{p.landlord_username}</td>
                <td className="border p-2">{p.is_approved ? 'Yes' : 'No'}</td>
                <td className="border p-2">
                  <Button onClick={() => handleApproveProperty(p.id)}>Approve</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">Reports</h2>
        <p>Total Properties: {reports.total_properties || 0}</p>
        <p>Total Users: {reports.total_users || 0}</p>
        <h3 className="mt-4">Most Viewed Properties</h3>
        <ul className="list-disc pl-5">
          {reports.most_viewed?.map(p => (
            <li key={p.id}>{p.area} (Last Updated: {p.updated_at})</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminDashboard;