// hooks/useFirestore.js
import { useState, useEffect } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { message } from "antd";

// Hook for managing groups - pass user email for Google users
export const useGroups = (userIdentifier) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userIdentifier) {
      setLoading(false);
      return;
    }

    const groupsRef = collection(db, "groups");

    // Use memberIds array for efficient querying
    const q = query(
      groupsRef,
      where("memberIds", "array-contains", userIdentifier),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groupsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGroups(groupsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching groups:", error);
        message.error("Failed to fetch groups. Please check your permissions.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userIdentifier]);

  const createGroup = async (groupData) => {
    try {
      const docRef = await addDoc(collection(db, "groups"), {
        ...groupData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      message.success("Group created successfully");
      return docRef.id;
    } catch (error) {
      console.error("Error creating group:", error);
      message.error(`Failed to create group: ${error.message}`);
      throw error;
    }
  };

  const updateGroup = async (groupId, updates) => {
    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        ...updates,
        updatedAt: new Date(),
      });
      message.success("Group updated successfully");
    } catch (error) {
      console.error("Error updating group:", error);
      message.error(`Failed to update group: ${error.message}`);
      throw error;
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      await deleteDoc(doc(db, "groups", groupId));
      message.success("Group deleted successfully");
    } catch (error) {
      console.error("Error deleting group:", error);
      message.error(`Failed to delete group: ${error.message}`);
      throw error;
    }
  };

  return {
    groups,
    loading,
    createGroup,
    updateGroup,
    deleteGroup,
  };
};

// Hook for managing expenses
export const useExpenses = (groupId) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const expensesRef = collection(db, "expenses");
    const q = query(
      expensesRef,
      where("groupId", "==", groupId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const expensesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExpenses(expensesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching expenses:", error);
        message.error(
          "Failed to fetch expenses. Please check your permissions.",
        );
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [groupId]);

  const addExpense = async (expenseData) => {
    try {
      await addDoc(collection(db, "expenses"), {
        ...expenseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      message.success("Expense added successfully");
    } catch (error) {
      console.error("Error adding expense:", error);
      message.error(`Failed to add expense: ${error.message}`);
      throw error;
    }
  };

  const updateExpense = async (expenseId, updates) => {
    try {
      const expenseRef = doc(db, "expenses", expenseId);
      await updateDoc(expenseRef, {
        ...updates,
        updatedAt: new Date(),
      });
      message.success("Expense updated successfully");
    } catch (error) {
      console.error("Error updating expense:", error);
      message.error(`Failed to update expense: ${error.message}`);
      throw error;
    }
  };

  const deleteExpense = async (expenseId) => {
    try {
      await deleteDoc(doc(db, "expenses", expenseId));
      message.success("Expense deleted successfully");
    } catch (error) {
      console.error("Error deleting expense:", error);
      message.error(`Failed to delete expense: ${error.message}`);
      throw error;
    }
  };

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
  };
};

// Members Hook (specific hook for member operations)
export const useMembers = (groupId) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "groups", groupId),
      (doc) => {
        if (doc.exists()) {
          const groupData = doc.data();
          setMembers(groupData.members || []);
        } else {
          setMembers([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching members:", error);
        message.error("Failed to load members");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [groupId]);

  return {
    members,
    loading,
  };
};

// Hook for managing settlements (settle-up payments between members)
export const useSettlements = (groupId) => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setSettlements([]);
      setLoading(false);
      return;
    }

    const settlementsRef = collection(db, "settlements");
    const q = query(
      settlementsRef,
      where("groupId", "==", groupId),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSettlements(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching settlements:", error);
        message.error("Failed to fetch settlements.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [groupId]);

  const addSettlement = async (data) => {
    try {
      await addDoc(collection(db, "settlements"), {
        ...data,
        groupId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      message.success("Settle up recorded");
    } catch (error) {
      console.error("Error adding settlement:", error);
      message.error(`Failed to record settlement: ${error.message}`);
      throw error;
    }
  };

  const updateSettlement = async (settlementId, updates) => {
    try {
      const ref = doc(db, "settlements", settlementId);
      await updateDoc(ref, {
        ...updates,
        updatedAt: new Date(),
      });
      message.success("Settlement updated");
    } catch (error) {
      console.error("Error updating settlement:", error);
      message.error(`Failed to update settlement: ${error.message}`);
      throw error;
    }
  };

  const deleteSettlement = async (settlementId) => {
    try {
      await deleteDoc(doc(db, "settlements", settlementId));
      message.success("Settlement deleted");
    } catch (error) {
      console.error("Error deleting settlement:", error);
      message.error(`Failed to delete settlement: ${error.message}`);
      throw error;
    }
  };

  return { settlements, loading, addSettlement, updateSettlement, deleteSettlement };
};
