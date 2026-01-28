import { WrappedData } from '../types';

export const GOLDEN_USER: WrappedData = {
    username: 'stellar_legend',
    address: 'G...LEGEND',
    stats: {
        totalTransactions: 1250,
        totalVolume: 45000.5,
        mostActiveMonth: 'October',
        gasSpent: 12.4,
        rank: 42,
        percentile: 99.5,
    },
    topDapps: [
        {
            name: 'Mercurius',
            transactions: 450,
            color: '#FF6B9D',
            gradient: 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)',
        },
        {
            name: 'Phoenix',
            transactions: 320,
            color: '#4FACFE',
            gradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
        },
        {
            name: 'Blend',
            transactions: 210,
            color: '#43E97B',
            gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)',
        },
    ],
    vibes: [
        {
            type: 'defi',
            percentage: 65,
            color: 'linear-gradient(135deg, #A445B2 0%, #D41872 100%)',
            label: 'DeFi Sorcerer',
        },
        {
            type: 'nft',
            percentage: 25,
            color: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
            label: 'Art Curator',
        },
        {
            type: 'dev',
            percentage: 10,
            color: 'linear-gradient(135deg, #30CFD0 0%, #330867 100%)',
            label: 'Code Alchemist',
        },
    ],
    archetype: {
        name: 'The Wizard',
        description: 'Like Gandalf in Middle-earth, you wield DeFi magic with wisdom. The blockchain bends to your will.',
        image: '/archetypes/wizard.png',
    },
};

export const EMPTY_USER: WrappedData = {
    username: 'stellar_newbie',
    address: 'G...NEWBIE',
    stats: {
        totalTransactions: 0,
        totalVolume: 0,
        mostActiveMonth: 'None',
        gasSpent: 0,
        rank: 0,
        percentile: 0,
    },
    topDapps: [],
    vibes: [],
    archetype: {
        name: 'The Explorer',
        description: 'Your journey on Stellar has just begun. The vast network awaits your first move.',
        image: '/archetypes/explorer.png',
    },
};
