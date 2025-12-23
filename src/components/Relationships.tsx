import React, { useState, useMemo } from 'react';
import { format, isValid, subYears } from 'date-fns';
import { useTimelineStore } from '../store/timelineStore';
import { Relationship } from '../types';
import { Users, Calendar, MapPin, Plus, X, Edit, Trash2, ChevronDown, User, HelpCircle, Archive } from 'lucide-react';
import { RelationshipTrackerForm } from './RelationshipTrackerForm';

type SortOption = 'name' | 'interactions' | 'recent' | 'relationshipType';
type StatusFilter = 'all' | 'current' | 'ended';

export const Relationships: React.FC = () => {
  const {
    relationships,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    incrementRelationshipInteraction
  } = useTimelineStore();

  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Relationship | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('current');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    relationshipType: '',
    notes: '',
    metDate: undefined as Date | undefined,
    metDateFuzzy: false,
    yearsKnown: undefined as number | undefined,
    trackNurturing: true, // Default to tracking nurturing
    useAge: false, // Toggle for age-based date entry
    metAtAge: undefined as number | undefined, // Age when met
  });

  // Filter and sort relationships
  const sortedRelationships = useMemo(() => {
    // First filter by status
    let filtered = relationships;
    if (filterStatus === 'current') {
      filtered = relationships.filter(r => r.isCurrent !== false);
    } else if (filterStatus === 'ended') {
      filtered = relationships.filter(r => r.isCurrent === false);
    }

    // Then sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.fullName.localeCompare(b.fullName));
      case 'interactions':
        return sorted.sort((a, b) => b.interactionCount - a.interactionCount);
      case 'recent':
        return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case 'relationshipType':
        return sorted.sort((a, b) => a.relationshipType.localeCompare(b.relationshipType));
      default:
        return sorted;
    }
  }, [relationships, sortBy, filterStatus]);



  const handleFormSubmit = async (data: any) => {
    if (editingPerson) {
      await updateRelationship(editingPerson.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        relationshipType: data.relationshipType,
        notes: data.notes,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent,
        // Preserve existing fields not in form if needed, or defaults
        trackNurturing: editingPerson.trackNurturing,
      });
      setEditingPerson(null);
    } else {
      await addRelationship({
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`.trim(),
        relationshipType: data.relationshipType,
        notes: data.notes,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent,
        trackNurturing: true,
      });
      setShowAddPerson(false);
    }
  };

  const handleDeletePerson = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await deleteRelationship(id);
      if (selectedPerson === id) {
        setSelectedPerson(null);
      }
    }
  };

  const startEdit = (relationship: Relationship) => {
    setEditingPerson(relationship);
  };

  const cancelEdit = () => {
    setEditingPerson(null);
  };

  const selectedPersonData = selectedPerson
    ? relationships.find(r => r.id === selectedPerson)
    : null;

  return (
    <div className="bg-theme-primary rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-theme-primary">Connections</h2>

        <button
          onClick={() => setShowAddPerson(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Person
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">{relationships.length}</div>
          <div className="text-sm text-theme-tertiary">Total People</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">
            {relationships.filter(r => r.interactionCount > 0).length}
          </div>
          <div className="text-sm text-theme-tertiary">With Stories</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">
            {Math.max(0, ...relationships.map(r => r.interactionCount))}
          </div>
          <div className="text-sm text-theme-tertiary">Most Interactions</div>
        </div>
        <div className="text-center p-4 bg-theme-tertiary rounded-lg">
          <div className="text-2xl font-bold text-theme-primary">
            {new Set(relationships.map(r => r.relationshipType)).size}
          </div>
          <div className="text-sm text-theme-tertiary">Relationship Types</div>
        </div>
      </div>

      {/* Filter and Sort Options */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="text-sm font-medium text-theme-secondary mr-2">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
            className="px-3 py-1 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="current">Current</option>
            <option value="ended">Ended</option>
            <option value="all">All</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-theme-secondary mr-2">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1 border border-theme rounded-md bg-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="recent">Recently Updated</option>
            <option value="name">Name</option>
            <option value="interactions">Most Interactions</option>
            <option value="relationshipType">Relationship Type</option>
          </select>
        </div>
      </div>

      {/* Add/Edit Person Modal */}
      {(showAddPerson || editingPerson) && (
        <RelationshipTrackerForm
          onClose={() => {
            setShowAddPerson(false);
            setEditingPerson(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={editingPerson || undefined}
          onDelete={editingPerson ? () => handleDeletePerson(editingPerson.id, editingPerson.fullName).then(() => setEditingPerson(null)) : undefined}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* People List */}
        <div>
          <h3 className="text-lg font-semibold text-theme-primary mb-4">All People</h3>
          <div className="space-y-2">
            {sortedRelationships.map(relationship => (
              <div
                key={relationship.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all group ${selectedPerson === relationship.id
                  ? 'border-primary-500 bg-primary-500/20'
                  : 'border-theme hover:border-theme hover:bg-theme-tertiary'
                  } ${relationship.isCurrent === false ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 flex-1"
                    onClick={() => setSelectedPerson(relationship.id)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${relationship.isCurrent === false ? 'bg-gray-400/30' : 'bg-primary-500/30'}`}>
                      {relationship.isCurrent === false ? (
                        <Archive className="w-5 h-5 text-gray-500" />
                      ) : (
                        <User className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-theme-primary">{relationship.fullName}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {relationship.relationshipType} • {relationship.interactionCount} interactions
                        {relationship.isCurrent === false && <span className="ml-2 text-yellow-600">(Ended)</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(relationship);
                      }}
                      className="p-1 text-gray-400 hover:text-theme-tertiary"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePerson(relationship.id, relationship.fullName);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {relationships.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No people added yet</p>
                <button
                  onClick={() => setShowAddPerson(true)}
                  className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Add your first person
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Person Details */}
        <div>
          {selectedPersonData ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-theme-primary">
                  {selectedPersonData.fullName}
                </h3>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="text-gray-400 hover:text-theme-tertiary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Relationship Summary */}
                <div className="p-4 bg-theme-tertiary rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Relationship:</span>
                      <div className="font-medium">
                        {selectedPersonData.relationshipType}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Interactions:</span>
                      <div className="font-medium">
                        {selectedPersonData.interactionCount} stories
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Added:</span>
                      <div className="font-medium">
                        {format(new Date(selectedPersonData.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Last Updated:</span>
                      <div className="font-medium">
                        {format(new Date(selectedPersonData.updatedAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedPersonData.notes && (
                  <div>
                    <h4 className="font-medium text-theme-primary mb-2">Notes</h4>
                    <p className="text-theme-secondary bg-theme-tertiary p-3 rounded-lg">
                      {selectedPersonData.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(selectedPersonData)}
                    className="flex-1 px-4 py-2 bg-theme-tertiary text-theme-secondary rounded-md hover:opacity-80 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => incrementRelationshipInteraction(selectedPersonData.id)}
                    className="flex-1 px-4 py-2 bg-primary-500/30 text-primary-700 rounded-md hover:bg-primary-200"
                  >
                    Add Interaction
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Select a person to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
