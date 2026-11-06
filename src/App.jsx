import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RoleRoute from './components/RoleRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Artists from './pages/Artists.jsx'
import ArtistProfile from './pages/ArtistProfile.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import MyEvents from './pages/MyEvents.jsx'
import EventEditor from './pages/EventEditor.jsx'
import Gigs from './pages/Gigs.jsx'
import Bookings from './pages/Bookings.jsx'
import BookingDetail from './pages/BookingDetail.jsx'
import Calendar from './pages/Calendar.jsx'
import Notifications from './pages/Notifications.jsx'
import Admin from './pages/Admin.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/artists" element={<Artists />} />
      <Route path="/artists/:artistId" element={<ArtistProfile />} />

      {/* Logged-in only: every route nested here goes through ProtectedRoute first */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/bookings/:bookingId" element={<BookingDetail />} />

        <Route element={<RoleRoute allow={['organizer', 'artist']} />}>
          <Route path="/bookings" element={<Bookings />} />
        </Route>
        <Route element={<RoleRoute allow={['organizer']} />}>
          <Route path="/events" element={<MyEvents />} />
          <Route path="/events/new" element={<EventEditor />} />
          <Route path="/events/:eventId/edit" element={<EventEditor />} />
        </Route>
        <Route element={<RoleRoute allow={['artist']} />}>
          <Route path="/gigs" element={<Gigs />} />
          <Route path="/calendar" element={<Calendar />} />
        </Route>
        <Route element={<RoleRoute allow={['admin']} />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
