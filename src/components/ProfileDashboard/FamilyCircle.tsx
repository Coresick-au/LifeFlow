import React from 'react';
import { FamilyMember } from '../../types';
import { User, Heart, Users, Baby } from 'lucide-react';
import { differenceInYears } from 'date-fns';

interface FamilyCircleProps {
    family: FamilyMember[];
    userName: string;
}

const roleIcons = {
    parent: Users,
    sibling: User,
    partner: Heart,
    child: Baby,
};

const roleColors = {
    parent: 'bg-blue-500',
    sibling: 'bg-green-500',
    partner: 'bg-pink-500',
    child: 'bg-purple-500',
};

const roleLabels = {
    parent: 'Parent',
    sibling: 'Sibling',
    partner: 'Partner',
    child: 'Child',
};

/**
 * FamilyCircle Component
 * Visual representation of immediate family members.
 */
export const FamilyCircle: React.FC<FamilyCircleProps> = ({ family, userName }) => {
    if (!family || family.length === 0) {
        return (
            <div className="bg-theme-primary rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-theme-primary mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Family Circle
                </h4>
                <div className="text-center py-6 text-theme-tertiary">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No family members added yet</p>
                    <p className="text-xs mt-1">Add family members in your profile settings</p>
                </div>
            </div>
        );
    }

    // Group by role
    const parents = family.filter(f => f.role === 'parent');
    const siblings = family.filter(f => f.role === 'sibling');
    const partners = family.filter(f => f.role === 'partner');
    const children = family.filter(f => f.role === 'child');

    const calculateAge = (birthDate?: Date) => {
        if (!birthDate) return null;
        return differenceInYears(new Date(), new Date(birthDate));
    };

    const renderMember = (member: FamilyMember) => {
        const IconComponent = roleIcons[member.role];
        const colorClass = roleColors[member.role];
        const age = calculateAge(member.birthDate);

        return (
            <div
                key={member.id}
                className="flex items-center gap-3 p-2 bg-theme-tertiary rounded-lg"
            >
                <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center text-white`}>
                    <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-theme-primary truncate">{member.name}</span>
                        {!member.isLiving && (
                            <span className="text-xs text-theme-tertiary">✝</span>
                        )}
                    </div>
                    <div className="text-xs text-theme-tertiary">
                        {roleLabels[member.role]}
                        {age !== null && ` • ${age} years old`}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-theme-primary rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-theme-primary mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Family Circle
                <span className="text-xs font-normal text-theme-tertiary">({family.length} members)</span>
            </h4>

            <div className="space-y-3">
                {/* Partners */}
                {partners.length > 0 && (
                    <div>
                        <div className="text-xs font-medium text-theme-tertiary mb-1">Partner</div>
                        <div className="space-y-1">
                            {partners.map(renderMember)}
                        </div>
                    </div>
                )}

                {/* Parents */}
                {parents.length > 0 && (
                    <div>
                        <div className="text-xs font-medium text-theme-tertiary mb-1">Parents</div>
                        <div className="space-y-1">
                            {parents.map(renderMember)}
                        </div>
                    </div>
                )}

                {/* Siblings */}
                {siblings.length > 0 && (
                    <div>
                        <div className="text-xs font-medium text-theme-tertiary mb-1">Siblings</div>
                        <div className="space-y-1">
                            {siblings.map(renderMember)}
                        </div>
                    </div>
                )}

                {/* Children */}
                {children.length > 0 && (
                    <div>
                        <div className="text-xs font-medium text-theme-tertiary mb-1">Children</div>
                        <div className="space-y-1">
                            {children.map(renderMember)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
