import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SearchableDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  localStorageKey, 
  labelName 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customOptions, setCustomOptions] = useState([]);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (localStorageKey) {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        try {
          setCustomOptions(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse custom options', e);
        }
      }
    }
  }, [localStorageKey]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        // Reset search term when closing to show selected value
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  const allOptions = [...new Set([...options, ...customOptions])];
  
  const filteredOptions = allOptions.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExactMatch = allOptions.some(opt => opt.toLowerCase() === searchTerm.toLowerCase().trim());
  const showAddOption = searchTerm.trim().length > 0 && !isExactMatch;

  const handleSelect = (option) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCustomAdd = () => {
    const newValue = searchTerm.trim();
    if (!newValue) return;

    if (localStorageKey) {
      const updatedCustom = [...customOptions, newValue];
      setCustomOptions(updatedCustom);
      localStorage.setItem(localStorageKey, JSON.stringify(updatedCustom));
    }
    
    onChange(newValue);
    setSearchTerm('');
    setIsOpen(false);
    toast.success(`Added new ${labelName}: ${newValue}`);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className="input-field bg-surface-bg flex items-center justify-between cursor-text relative"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div className="flex-1 truncate pr-6 h-full flex items-center">
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent focus:outline-none placeholder-text-muted/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search or add ${labelName.toLowerCase()}...`}
            />
          ) : (
             <span className={value ? 'text-text-primary h-full' : 'text-text-muted/50 h-full overflow-hidden'}>
               {value || placeholder}
             </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 absolute right-4 top-1/2 -translate-y-1/2 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface-card border border-surface-border rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
          
          {filteredOptions.length > 0 ? (
            <div className="p-1.5 space-y-0.5">
              {filteredOptions.map((opt) => (
                <div
                  key={opt}
                  className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer flex items-center justify-between transition-colors ${value === opt ? 'bg-accent-green/10 text-text-primary' : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'}`}
                  onClick={() => handleSelect(opt)}
                >
                  <span className={value === opt ? 'font-semibold' : ''}>{opt}</span>
                  {value === opt && <Check className="w-4 h-4 text-accent-green" />}
                </div>
              ))}
            </div>
          ) : (
            !showAddOption && <div className="p-4 text-sm text-text-muted text-center italic">No matches found</div>
          )}

          {showAddOption && (
            <div className="p-1 border-t border-surface-border mt-1">
              <div 
                className="px-3 py-2.5 rounded-lg text-sm text-accent-primary font-semibold flex items-center gap-2 cursor-pointer hover:bg-accent-primary/10 transition-colors"
                onClick={handleCustomAdd}
              >
                <Plus className="w-4 h-4" />
                <span>Add "{searchTerm.trim()}"</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
