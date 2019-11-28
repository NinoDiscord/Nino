import FlagParser from './FlagParser';

describe('FlagParser', () => {
    let instance: FlagParser;

    beforeAll(() => {
        instance = new FlagParser(['argument', 'anotherone', 'another--key1=value1', '-key2', '=', 'value2--key3=', 'value3', '--boolkey']);
    });

    it('it should get flag with key: key1', () => {
        expect(instance).toBeInstanceOf(FlagParser);
        const keyone = instance.get('key1');
        expect(keyone).toBeDefined();
        expect(keyone).toBe('value1');
    }); 

    it('it should get flag with key: key2', () => {
        expect(instance).toBeInstanceOf(FlagParser);
        const keytwo = instance.get('key2');
        expect(keytwo).toBeDefined();
        expect(keytwo).toBe('value2');
    }); 

    it('it should get flag with key: key3', () => {
        expect(instance).toBeInstanceOf(FlagParser);
        const keythree = instance.get('key3');
        expect(keythree).toBeDefined();
        expect(keythree).toBe('value3');
    }); 

    it('it should get flag with key: boolkey', () => {
        expect(instance).toBeInstanceOf(FlagParser);
        const boolkey = instance.get('boolkey');
        expect(boolkey).toBeDefined();
        expect(boolkey).toBe(true);
    });

    it('it should be undefined on missing key', () => {
        expect(instance).toBeInstanceOf(FlagParser);
        expect(instance.get('key4')).toBeUndefined();
    });
});