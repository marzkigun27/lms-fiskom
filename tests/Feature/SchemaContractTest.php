<?php

use App\Models\Grade;
use App\Models\Group;
use App\Models\Module;
use App\Models\PracticumClass;
use App\Models\Question;
use App\Models\Submission;

it('maps academic models to the PRD schema', function () {
    expect((new PracticumClass)->getTable())->toBe('classes')
        ->and((new Group)->isFillable('class_id'))->toBeTrue()
        ->and((new Group)->isFillable('assistant_id'))->toBeFalse()
        ->and((new Module)->isFillable('title'))->toBeTrue()
        ->and((new Module)->isFillable('name'))->toBeFalse()
        ->and((new Question)->isFillable('description'))->toBeTrue()
        ->and((new Question)->isFillable('answer_type'))->toBeTrue()
        ->and((new Submission)->isFillable('participant_id'))->toBeTrue()
        ->and((new Submission)->isFillable('answer_text'))->toBeFalse()
        ->and((new Grade)->isFillable('participant_id'))->toBeTrue()
        ->and((new Grade)->isFillable('assistant_id'))->toBeFalse();
});

it('exposes PRD relationships on submission and grading models', function () {
    expect(method_exists(Submission::class, 'participant'))->toBeTrue()
        ->and(method_exists(Submission::class, 'submissionAnswers'))->toBeTrue()
        ->and(method_exists(Grade::class, 'participant'))->toBeTrue()
        ->and(method_exists(Grade::class, 'module'))->toBeTrue()
        ->and(method_exists(Grade::class, 'gradedBy'))->toBeTrue();
});
