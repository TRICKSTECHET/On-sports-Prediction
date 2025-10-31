import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Platform,
} from "react-native";
import {
  AdMobBanner,
  AdMobInterstitial,
  setTestDeviceIDAsync,
} from "expo-ads-admob";
import AsyncStorage from "@react-native-async-storage/async-storage";

const matches = [
  { id: 1, teamA: "Arsenal", teamB: "Chelsea", prediction: "Arsenal", confidence: 78 },
  { id: 2, teamA: "Barcelona", teamB: "Real Madrid", prediction: "Barcelona", confidence: 64 },
  { id: 3, teamA: "Man City", teamB: "Liverpool", prediction: "Liverpool", confidence: 52 },
];

// Your contact links (you provided WhatsApp & Telegram)
const WHATSAPP_LINK = "https://wa.me/256789186211";
const TELEGRAM_LINK = "https://t.me/TTH_hk";
// Replace below with your actual email address
const CONTACT_EMAIL = "busobojovan@gmail.com";

const STORAGE_VOTES_KEY = "@bp_votes";

export default function App() {
  const [votes, setVotes] = useState({}); // { matchId: teamName }

  // Prepare interstitial (and mark test device)
  useEffect(() => {
    const prepare = async () => {
      try {
        await setTestDeviceIDAsync("EMULATOR");
        // Test interstitial Ad Unit ID from Google (leave while testing)
        await AdMobInterstitial.setAdUnitID("ca-app-pub-2451995224752274/5851861001");
        // Preload
        await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
      } catch (err) {
        console.log("Interstitial prepare error:", err);
      }
    };
    prepare();
    // load saved votes
    loadVotes();
  }, []);

  // Load saved votes from AsyncStorage
  const loadVotes = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_VOTES_KEY);
      if (raw) setVotes(JSON.parse(raw));
    } catch (e) {
      console.log("Failed loading votes:", e);
    }
  };

  // Save votes whenever they change
  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_VOTES_KEY, JSON.stringify(votes));
      } catch (e) {
        console.log("Failed saving votes:", e);
      }
    };
    save();
  }, [votes]);

  // Show interstitial then register vote
  const handleVote = async (matchId, team) => {
    try {
      await AdMobInterstitial.showAdAsync(); // attempt show
      // preload next one
      AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true }).catch((e) =>
        console.log("preload fail:", e)
      );
    } catch (e) {
      // ad not ready or show failed — continue anyway
      console.log("Interstitial show failed or not ready:", e);
    }

    // Register vote locally
    setVotes((prev) => ({ ...prev, [matchId]: team }));
  };

  // Contact helpers
  const openWhatsApp = async () => {
    const url = WHATSAPP_LINK; // already in wa.me format
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open WhatsApp.");
    }
  };

  const openTelegram = async () => {
    const url = TELEGRAM_LINK;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open Telegram.");
    }
  };

  const openEmail = async () => {
    const subject = encodeURIComponent("Betting Predictions - Inquiry");
    const body = encodeURIComponent("Hi,\nI have a question about the Betting Predictions app.");
    const url = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open email client.");
    }
  };

  // Reset votes (for testing)
  const resetVotes = async () => {
    setVotes({});
    try {
      await AsyncStorage.removeItem(STORAGE_VOTES_KEY);
      Alert.alert("Votes reset.");
    } catch (e) {
      console.log("Failed clearing storage:", e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚽On Sports Prediction</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 20 }}>
        {matches.map((m) => (
          <View key={m.id} style={styles.card}>
            <Text style={styles.match}>
              {m.teamA} vs {m.teamB}
            </Text>
            <Text style={styles.prediction}>
              Predicted Winner: {m.prediction} ({m.confidence}%)
            </Text>

            <View style={styles.buttonRow}>
              {[m.teamA, m.teamB].map((team) => (
                <TouchableOpacity
                  key={team}
                  onPress={() => handleVote(m.id, team)}
                  style={[
                    styles.voteButton,
                    votes[m.id] === team && styles.votedButton,
                  ]}
                >
                  <Text style={[styles.voteText, votes[m.id] === team && { color: "#fff" }]}>
                    Vote {team}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {votes[m.id] && <Text style={styles.votedText}>✅ You voted for {votes[m.id]}</Text>}
          </View>
        ))}

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>🧾 Your Voting Summary</Text>
          {Object.keys(votes).length === 0 ? (
            <Text style={styles.noVotes}>You haven’t voted yet.</Text>
          ) : (
            Object.keys(votes).map((id) => {
              const match = matches.find((mm) => mm.id == id);
              return (
                <Text key={id} style={styles.voteItem}>
                  {match.teamA} vs {match.teamB}: <Text style={{ fontWeight: "700" }}>{votes[id]}</Text>
                </Text>
              );
            })
          )}

          <TouchableOpacity onPress={resetVotes} style={styles.resetButton}>
            <Text style={{ color: "white", fontWeight: "700" }}>Reset All Votes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactSection}>
          <TouchableOpacity onPress={openWhatsApp} style={[styles.contactButton, { backgroundColor: "#25D366" }]}>
            <Text style={styles.contactText}>💬 WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openTelegram} style={[styles.contactButton, { backgroundColor: "#0088cc" }]}>
            <Text style={styles.contactText}>📢 Telegram</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openEmail} style={[styles.contactButton, { backgroundColor: "#6b7280" }]}>
            <Text style={styles.contactText}>✉️ Email</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Banner ad (bottom). Test banner id is used here. */}
      <View style={styles.adContainer}>
        <AdMobBanner
          bannerSize="smartBannerPortrait"
          adUnitID="ca-app-pub-2451995224752274/3012292289" // TEST banner ID
          servePersonalizedAds
          onDidFailToReceiveAdWithError={(err) => console.log("Banner ad error:", err)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#1e40af",
    marginTop: Platform.OS === "ios" ? 50 : 20,
    marginBottom: 10,
  },
  scroll: { paddingHorizontal: 12 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  match: { fontSize: 16, fontWeight: "700" },
  prediction: { color: "gray", marginVertical: 6 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
  voteButton: {
    backgroundColor: "#e5e7eb",
    padding: 8,
    borderRadius: 8,
    flex: 0.48,
    alignItems: "center",
  },
  votedButton: { backgroundColor: "#2563eb" },
  voteText: { fontWeight: "700", color: "#111827" },
  votedText: { color: "green", marginTop: 8, fontWeight: "700" },
  summary: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginVertical: 16,
  },
  summaryTitle: { fontSize: 18, fontWeight: "800", color: "#1e40af" },
  noVotes: { textAlign: "center", color: "gray", marginTop: 8 },
  voteItem: { marginTop: 8 },
  resetButton: {
    marginTop: 12,
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  contactSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 28,
  },
  contactButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 92,
    alignItems: "center",
  },
  contactText: { color: "white", fontWeight: "800" },
  adContainer: {
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 6,
  },
});      