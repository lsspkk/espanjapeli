// Category Configuration and Metadata
// This file defines the recommended learning order and metadata for word categories
// Based on language learning research (see LANGUAGE_LEARNING.md)

const CATEGORY_CONFIG = {
    // Tier 1: Foundation (Critical for basic communication - CEFR A1 Foundation)
    pronouns: {
        order: 1,
        tier: 1,
        tierName: 'Foundation',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'critical',
        description: 'Essential pronouns for forming any sentence',
        learningNote: 'Start here - you cannot form sentences without pronouns',
        estimatedStudyTime: '1-2 hours',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    common: {
        order: 2,
        tier: 1,
        tierName: 'Foundation',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'critical',
        description: 'High-frequency words used in 50%+ of conversations',
        learningNote: 'These words appear constantly - memorize them first',
        estimatedStudyTime: '3-4 hours',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    questions: {
        order: 3,
        tier: 1,
        tierName: 'Foundation',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'critical',
        description: 'Question words essential for communication',
        learningNote: 'Critical for asking and understanding questions',
        estimatedStudyTime: '30 minutes',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    prepositions: {
        order: 4,
        tier: 1,
        tierName: 'Foundation',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'critical',
        description: 'Prepositions and conjunctions for sentence structure',
        learningNote: 'Connect words and ideas together',
        estimatedStudyTime: '2-3 hours',
        recommendedFor: ['adults', 'teens']
    },
    
    verbs: {
        order: 5,
        tier: 1,
        tierName: 'Foundation',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'critical',
        description: 'Most common action verbs',
        learningNote: 'Core verbs - practice conjugations separately',
        estimatedStudyTime: '4-5 hours',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    // Tier 2: Concrete Basics (Easy to visualize - CEFR A1 Core)
    numbers: {
        order: 6,
        tier: 2,
        tierName: 'Concrete Basics',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'high',
        description: 'Numbers for counting, prices, dates',
        learningNote: 'Concrete and immediately useful',
        estimatedStudyTime: '2-3 hours',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    colors: {
        order: 7,
        tier: 2,
        tierName: 'Concrete Basics',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'high',
        description: 'Basic color vocabulary',
        learningNote: 'Easy to learn - highly visual',
        estimatedStudyTime: '30-60 minutes',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    family: {
        order: 8,
        tier: 2,
        tierName: 'Concrete Basics',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'high',
        description: 'Family relationships',
        learningNote: 'Personal and relevant to daily life',
        estimatedStudyTime: '1 hour',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    body: {
        order: 9,
        tier: 2,
        tierName: 'Concrete Basics',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'high',
        description: 'Body parts',
        learningNote: 'Practical for health and daily life',
        estimatedStudyTime: '1-2 hours',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    time: {
        order: 10,
        tier: 2,
        tierName: 'Concrete Basics',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'high',
        description: 'Time expressions, days, dates',
        learningNote: 'Essential for scheduling and planning',
        estimatedStudyTime: '2 hours',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    // Tier 3: Everyday Topics (Daily life - CEFR A1-A2)
    food: {
        order: 11,
        tier: 3,
        tierName: 'Everyday Topics',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'high',
        description: 'Food and drink vocabulary',
        learningNote: 'Used daily - great for restaurant situations',
        estimatedStudyTime: '2-3 hours',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    home: {
        order: 12,
        tier: 3,
        tierName: 'Everyday Topics',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'high',
        description: 'Home and household items',
        learningNote: 'Describe your daily environment',
        estimatedStudyTime: '2 hours',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    clothing: {
        order: 13,
        tier: 3,
        tierName: 'Everyday Topics',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'high',
        description: 'Clothing and accessories',
        learningNote: 'Useful for shopping and describing appearance',
        estimatedStudyTime: '1-2 hours',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    animals: {
        order: 14,
        tier: 3,
        tierName: 'Everyday Topics',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'medium',
        description: 'Common animals',
        learningNote: 'Fun and engaging - great for children',
        estimatedStudyTime: '2 hours',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    emotions: {
        order: 15,
        tier: 3,
        tierName: 'Everyday Topics',
        difficulty: 'beginner',
        cefrLevel: 'A1',
        priority: 'high',
        description: 'Feelings and emotional states',
        learningNote: 'Express how you feel',
        estimatedStudyTime: '1 hour',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    // Tier 4: Practical Skills (Real-world situations - CEFR A2)
    adjectives: {
        order: 16,
        tier: 4,
        tierName: 'Practical Skills',
        difficulty: 'intermediate',
        cefrLevel: 'A2',
        priority: 'medium',
        description: 'Descriptive adjectives',
        learningNote: 'Add detail and description to your speech',
        estimatedStudyTime: '2-3 hours',
        recommendedFor: ['adults', 'teens']
    },
    
    places: {
        order: 17,
        tier: 4,
        tierName: 'Practical Skills',
        difficulty: 'intermediate',
        cefrLevel: 'A2',
        priority: 'medium',
        description: 'Public places and locations',
        learningNote: 'Navigate cities and ask for directions',
        estimatedStudyTime: '2 hours',
        recommendedFor: ['adults', 'teens']
    },
    
    transportation: {
        order: 18,
        tier: 4,
        tierName: 'Practical Skills',
        difficulty: 'intermediate',
        cefrLevel: 'A2',
        priority: 'medium',
        description: 'Transportation and travel',
        learningNote: 'Essential for travelers',
        estimatedStudyTime: '1-2 hours',
        recommendedFor: ['adults', 'teens']
    },
    
    money: {
        order: 19,
        tier: 4,
        tierName: 'Practical Skills',
        difficulty: 'intermediate',
        cefrLevel: 'A2',
        priority: 'medium',
        description: 'Money and shopping',
        learningNote: 'Handle transactions and negotiate prices',
        estimatedStudyTime: '1 hour',
        recommendedFor: ['adults', 'teens']
    },
    
    // Tier 5: Specialized (Context-specific - CEFR A2-B1)
    school: {
        order: 20,
        tier: 5,
        tierName: 'Specialized',
        difficulty: 'intermediate',
        cefrLevel: 'A2',
        priority: 'low',
        description: 'School and education vocabulary',
        learningNote: 'For students or parents',
        estimatedStudyTime: '1-2 hours',
        recommendedFor: ['teens', 'children']
    },
    
    nature: {
        order: 21,
        tier: 5,
        tierName: 'Specialized',
        difficulty: 'intermediate',
        cefrLevel: 'A2',
        priority: 'low',
        description: 'Nature and weather',
        learningNote: 'Describe the natural world',
        estimatedStudyTime: '2 hours',
        recommendedFor: ['adults', 'teens', 'children']
    },
    
    professions: {
        order: 22,
        tier: 5,
        tierName: 'Specialized',
        difficulty: 'intermediate',
        cefrLevel: 'A2',
        priority: 'low',
        description: 'Jobs and professions',
        learningNote: 'Discuss careers and occupations',
        estimatedStudyTime: '1-2 hours',
        recommendedFor: ['adults', 'teens']
    }
};

// Get categories sorted by recommended learning order
function getCategoriesByLearningOrder() {
    return Object.entries(CATEGORY_CONFIG)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([key, config]) => ({
            key,
            ...config
        }));
}

// Get categories by tier
function getCategoriesByTier(tierNumber) {
    return Object.entries(CATEGORY_CONFIG)
        .filter(([_, config]) => config.tier === tierNumber)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([key, config]) => ({
            key,
            ...config
        }));
}

// Get category metadata
function getCategoryMetadata(categoryKey) {
    return CATEGORY_CONFIG[categoryKey] || null;
}

// Get categories by difficulty
function getCategoriesByDifficulty(difficulty) {
    return Object.entries(CATEGORY_CONFIG)
        .filter(([_, config]) => config.difficulty === difficulty)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([key, config]) => ({
            key,
            ...config
        }));
}

// Get categories by CEFR level
function getCategoriesByCEFR(level) {
    return Object.entries(CATEGORY_CONFIG)
        .filter(([_, config]) => config.cefrLevel === level)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([key, config]) => ({
            key,
            ...config
        }));
}

// Get categories recommended for age group
function getCategoriesForAgeGroup(ageGroup) {
    return Object.entries(CATEGORY_CONFIG)
        .filter(([_, config]) => config.recommendedFor.includes(ageGroup))
        .sort((a, b) => a[1].order - b[1].order)
        .map(([key, config]) => ({
            key,
            ...config
        }));
}

// Get tier information
function getTierInfo() {
    return {
        1: {
            name: 'Foundation',
            description: 'Critical for basic communication',
            cefrLevel: 'A1',
            priority: 'Start here - these are essential building blocks'
        },
        2: {
            name: 'Concrete Basics',
            description: 'Easy to visualize and immediately useful',
            cefrLevel: 'A1',
            priority: 'High - learn these early for quick wins'
        },
        3: {
            name: 'Everyday Topics',
            description: 'Daily life vocabulary',
            cefrLevel: 'A1-A2',
            priority: 'High - very practical for daily situations'
        },
        4: {
            name: 'Practical Skills',
            description: 'Real-world situations and travel',
            cefrLevel: 'A2',
            priority: 'Medium - useful for practical scenarios'
        },
        5: {
            name: 'Specialized',
            description: 'Context-specific vocabulary',
            cefrLevel: 'A2-B1',
            priority: 'Low - learn based on personal needs'
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CATEGORY_CONFIG,
        getCategoriesByLearningOrder,
        getCategoriesByTier,
        getCategoryMetadata,
        getCategoriesByDifficulty,
        getCategoriesByCEFR,
        getCategoriesForAgeGroup,
        getTierInfo
    };
}

