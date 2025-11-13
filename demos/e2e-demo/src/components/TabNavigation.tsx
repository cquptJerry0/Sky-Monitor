import React from 'react'
import { type Tab, type TabId } from '../types'

interface TabNavigationProps {
    tabs: Tab[]
    activeTab: TabId
    onTabChange: (tabId: TabId) => void
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="border-b-2 border-black">
            <div className="flex overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
              px-6 py-3 text-sm font-medium whitespace-nowrap
              border-b-3 transition-all
              ${
                  activeTab === tab.id
                      ? 'border-black text-black font-semibold'
                      : 'border-transparent text-gray-600 hover:text-black hover:bg-gray-50'
              }
            `}
                        style={{
                            borderBottomWidth: activeTab === tab.id ? '3px' : '0',
                        }}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>
        </div>
    )
}
