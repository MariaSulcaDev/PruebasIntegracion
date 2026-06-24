package pe.edu.vallegrande.service;

import pe.edu.vallegrande.model.Persona;
import pe.edu.vallegrande.repository.PersonaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class PersonaService {

    private final PersonaRepository repository;

    public Flux<Persona> findAll() {
        return repository.findAll();
    }

    public Mono<Persona> findById(Long id) {
        return repository.findById(id);
    }

    public Mono<Persona> save(Persona persona) {
        return repository.save(persona);
    }

    public Mono<Persona> update(Long id, Persona persona) {
        return repository.findById(id)
                .flatMap(existing -> {
                    existing.setNombre(persona.getNombre());
                    existing.setApellido(persona.getApellido());
                    existing.setEmail(persona.getEmail());
                    existing.setTelefono(persona.getTelefono());
                    existing.setFechaNacimiento(persona.getFechaNacimiento());
                    return repository.save(existing);
                });
    }

    public Mono<Void> deleteById(Long id) {
        return repository.deleteById(id);
    }
}
