// src/services/profileManager.js

const PROFILES_STORAGE_KEY = 'sheetguard-profiles';

const getSeedData = () => [
  { 
    id: `profile-${Date.now()}-1`, 
    name: 'Validação de Medição Mensal', 
    lastUpdated: new Date('2025-09-12').toISOString(),
    sampleHeaders: ['ID_CLIENTE', 'CONSUMO_KWH', 'MES_REF', 'STATUS'],
    rules: [
      { id: `rule-${Date.now()}-1`, column: 'ID_CLIENTE', type: 'not-empty' },
      { id: `rule-${Date.now()}-2`, column: 'ID_CLIENTE', type: 'is-unique' },
      { id: `rule-${Date.now()}-3`, column: 'CONSUMO_KWH', type: 'is-number' },
      { id: `rule-${Date.now()}-4`, column: 'MES_REF', type: 'matches-regex', value: '^(0[1-9]|1[0-2])\\/20\\d{2}$' },
      { id: `rule-${Date.now()}-5`, column: 'STATUS', type: 'in-set', value: 'ATIVO,INATIVO,SUSPENSO' },
    ] 
  },
  { id: `profile-${Date.now()}-2`, name: 'Auditoria de Notas Fiscais (Q3)', lastUpdated: new Date('2025-09-10').toISOString(), sampleHeaders: [], rules: [] },
  { id: `profile-${Date.now()}-3`, name: 'Conformidade de Cadastro de Clientes', lastUpdated: new Date('2025-08-29').toISOString(), sampleHeaders: [], rules: [] },
];

export function loadProfiles() {
  try {
    const storedProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!storedProfiles) {
      const seedData = getSeedData();
      saveProfiles(seedData);
      return seedData;
    }
    return JSON.parse(storedProfiles);
  } catch (error) {
    console.error("Erro ao carregar perfis:", error);
    return [];
  }
}

export function saveProfiles(profiles) {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error("Erro ao salvar perfis:", error);
  }
}

export function addProfile(profileData) {
  const profiles = loadProfiles();
  const newProfile = {
    id: `profile-${Date.now()}`,
    ...profileData,
    lastUpdated: new Date().toISOString(),
    sampleHeaders: [],
    rules: [],
  };
  saveProfiles([newProfile, ...profiles]);
}

export function deleteProfile(profileId) {
  const profiles = loadProfiles();
  const updatedProfiles = profiles.filter(p => p.id !== profileId);
  saveProfiles(updatedProfiles);
}

export function updateProfile(updatedProfile) {
  const profiles = loadProfiles();
  const index = profiles.findIndex(p => p.id === updatedProfile.id);
  if (index !== -1) {
    profiles[index] = { ...profiles[index], ...updatedProfile, lastUpdated: new Date().toISOString() };
    saveProfiles(profiles);
  }
}

export function searchProfiles(query) {
  const profiles = loadProfiles();
  if (!query) return profiles;
  const lowercasedQuery = query.toLowerCase();
  return profiles.filter(p => p.name.toLowerCase().includes(lowercasedQuery));
}

export function deleteRuleFromProfile(profileId, ruleId) {
  try {
    const profiles = loadProfiles();
    const profileIndex = profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) return null;
    const profile = profiles[profileIndex];
    profile.rules = profile.rules.filter(rule => rule.id !== ruleId);
    profile.lastUpdated = new Date().toISOString();
    profiles[profileIndex] = profile;
    saveProfiles(profiles);
    return profile;
  } catch (error) {
    console.error("Erro ao excluir regra do perfil:", error);
    return null;
  }
}

export function addRuleToProfile(profileId, ruleData) {
  try {
    const profiles = loadProfiles();
    const profileIndex = profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) return null;
    const newRule = { id: `rule-${Date.now()}-${Math.random()}`, ...ruleData };
    const profile = profiles[profileIndex];
    profile.rules.push(newRule);
    profile.lastUpdated = new Date().toISOString();
    profiles[profileIndex] = profile;
    saveProfiles(profiles);
    return profile;
  } catch (error) {
    console.error("Erro ao adicionar regra ao perfil:", error);
    return null;
  }
}

export function updateRuleInProfile(profileId, updatedRule) {
  try {
    const profiles = loadProfiles();
    const profileIndex = profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) return null;

    const profile = profiles[profileIndex];
    const ruleIndex = profile.rules.findIndex(r => r.id === updatedRule.id);
    if (ruleIndex === -1) return null;

    profile.rules[ruleIndex] = updatedRule;
    profile.lastUpdated = new Date().toISOString();
    profiles[profileIndex] = profile;

    saveProfiles(profiles);
    return profile;
  } catch (error) {
    console.error("Erro ao atualizar regra no perfil:", error);
    return null;
  }
}

export function updateProfileSample(profileId, headers) {
  try {
    const profiles = loadProfiles();
    const profileIndex = profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) return null;

    profiles[profileIndex].sampleHeaders = headers;
    profiles[profileIndex].lastUpdated = new Date().toISOString();
    
    saveProfiles(profiles);
    return profiles[profileIndex];
  } catch (error) {
    console.error("Erro ao atualizar o ficheiro de exemplo do perfil:", error);
    return null;
  }
}