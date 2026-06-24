package pe.edu.vallegrande.repository;

import pe.edu.vallegrande.model.Persona;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

public interface PersonaRepository extends ReactiveCrudRepository<Persona, Long> {
}
