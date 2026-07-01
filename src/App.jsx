import React, { useEffect, useState } from "react";
import { Home, Dumbbell, Apple, Footprints, Trophy, Camera, ClipboardCheck } from "lucide-react";
import { C } from "./helpers";
import { supabase } from "./supabaseClient";
import { getCurrentSession, signOut, listClients, latestCheckInPerClient, getCoachViews, markClientViewed } from "./api";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { Toast, StorageBanner } from "./ui";

import AuthScreen from "./AuthScreen";
import Roster from "./Roster";
import ProfileMenuSheet from "./ProfileMenuSheet";
import Home_ from "./Home";
import Train from "./Train";
import Nutrition from "./Nutrition";
import Activity from "./Activity";
import Progress from "./Progress";
import Photos from "./Photos";
import CheckIn from "./CheckIn";
import Plan from "./Plan";

function Frame({ children }) {
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: C.stone, minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, background: C.paper, minHeight: "100vh", position: "relative", boxShadow: "0 0 40px rgba(0,0,0,0.04)" }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [viewingClientId, setViewingClientId] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [clientList, setClientList] = useState([]);
  const [unreadIds, setUnreadIds] = useState([]);
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState("");
  const [hideNav, setHideNav] = useState(false);
  const [authError, setAuthError] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentSession();
        if (user) {
          setCurrentUser(user);
          if (user.role === "client") setViewingClientId(user.id);
        }
      } catch (err) {
        console.error(err);
        setAuthError("Couldn't reach the server. Check your Supabase setup in .env.");
      }
      setBooting(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setViewingClientId(null);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // load roster when a trainer has no client selected
  useEffect(() => {
    if (currentUser?.role === "trainer" && !viewingClientId) {
      listClients().then(setClientList).catch(console.error);
      refreshUnread();
    }
  }, [currentUser, viewingClientId]);

  async function refreshUnread() {
    if (!currentUser || currentUser.role !== "trainer") return;
    try {
      const [latest, views] = await Promise.all([
        latestCheckInPerClient(),
        getCoachViews(currentUser.id),
      ]);
      const unread = Object.keys(latest).filter((clientId) => {
        const lastViewed = views[clientId];
        if (!lastViewed) return true;
        return new Date(latest[clientId]) > new Date(lastViewed);
      });
      setUnreadIds(unread);
    } catch (err) {
      console.error(err);
    }
  }

  async function openClient(id) {
    setViewingClientId(id);
    setTab("home");
    setUnreadIds((prev) => prev.filter((x) => x !== id));
    if (currentUser?.role === "trainer") {
      try {
        await markClientViewed(currentUser.id, id);
      } catch (err) {
        console.error(err);
      }
    }
  }

  // resolve the viewed client's profile/name for trainers
  useEffect(() => {
    if (currentUser?.role === "trainer" && viewingClientId) {
      const c = clientList.find((c) => c.id === viewingClientId);
      if (c) setViewingClient(c);
      else listClients().then((list) => {
        setClientList(list);
        setViewingClient(list.find((c) => c.id === viewingClientId) || null);
      });
    }
  }, [viewingClientId, currentUser]);

  async function handleAuthed(user) {
    setCurrentUser(user);
    if (user.role === "client") {
      setViewingClientId(user.id);
    }
  }

  async function handleLogout() {
    await signOut();
    setCurrentUser(null);
    setViewingClientId(null);
    setViewingClient(null);
    setShowProfileMenu(false);
    setTab("home");
  }

  const tabs = [
    { key: "home", label: "Home", icon: Home },
    { key: "train", label: "Train", icon: Dumbbell },
    { key: "nutrition", label: "Macros", icon: Apple },
    { key: "activity", label: "Activity", icon: Footprints },
    { key: "checkin", label: "Check-in", icon: ClipboardCheck },
    { key: "progress", label: "Progress", icon: Trophy },
    { key: "photos", label: "Photos", icon: Camera },
  ];

  if (booting) {
    return (
      <Frame>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.graphite, fontSize: 13 }}>
          Loading…
        </div>
      </Frame>
    );
  }

  if (authError) {
    return (
      <Frame>
        <div style={{ padding: 30 }}>
          <StorageBanner text={authError} />
        </div>
      </Frame>
    );
  }

  if (!currentUser) {
    return (
      <Frame>
        <AuthScreen onAuthed={handleAuthed} />
      </Frame>
    );
  }

  // trainer with no client selected -> roster
  if (currentUser.role === "trainer" && !viewingClientId) {
    return (
      <Frame>
        <Header profile={currentUser} onOpenProfileMenu={() => setShowProfileMenu(true)} />
        <Roster clients={clientList} unreadIds={unreadIds} onSelect={openClient} />
        <BottomNav tabs={[{ key: "home", label: "Clients", icon: Home }]} active="home" onChange={() => {}} />
        {showProfileMenu && <ProfileMenuSheet user={currentUser} onClose={() => setShowProfileMenu(false)} onLogout={handleLogout} />}
      </Frame>
    );
  }

  const isTrainerViewing = currentUser.role === "trainer";
  const viewingName = isTrainerViewing ? viewingClient?.name || "…" : currentUser.name;
  const dataClientId = isTrainerViewing ? viewingClientId : currentUser.id;

  return (
    <Frame>
      <Header
        profile={currentUser}
        coachingClient={isTrainerViewing ? viewingClient : null}
        onSwitchClient={() => setViewingClientId(null)}
        onOpenProfileMenu={() => setShowProfileMenu(true)}
      />

      {tab === "home" && (
        <Home_ clientId={dataClientId} clientName={viewingName} isTrainerViewing={isTrainerViewing} goTab={setTab} />
      )}
      {tab === "train" && (
        <Train
          clientId={dataClientId}
          viewerRole={currentUser.role}
          viewerName={currentUser.name}
          viewingClientName={viewingName}
          showToast={showToast}
          onFullscreenChange={setHideNav}
        />
      )}
      {tab === "nutrition" && <Nutrition clientId={dataClientId} viewerRole={currentUser.role} showToast={showToast} />}
      {tab === "activity" && <Activity clientId={dataClientId} showToast={showToast} />}
      {tab === "checkin" && <CheckIn clientId={dataClientId} viewerRole={currentUser.role} showToast={showToast} />}
      {tab === "progress" && <Progress clientId={dataClientId} showToast={showToast} />}
      {tab === "photos" && <Photos clientId={dataClientId} showToast={showToast} />}
      {tab === "plan" && (
        <Plan
          clientId={dataClientId}
          clientName={viewingName}
          viewerRole={currentUser.role}
          onBack={() => setTab("home")}
          showToast={showToast}
        />
      )}

      {!hideNav && tab !== "plan" && <BottomNav tabs={tabs} active={tab} onChange={setTab} />}
      {showProfileMenu && <ProfileMenuSheet user={currentUser} onClose={() => setShowProfileMenu(false)} onLogout={handleLogout} />}
      <Toast text={toast} />
    </Frame>
  );
}
