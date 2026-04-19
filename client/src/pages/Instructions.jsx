import React from 'react';

const Instructions = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold text-center mb-12">General Instructions</h1>

      <ul className="list-disc space-y-4 max-w-4xl mx-auto text-gray-200 text-base leading-relaxed">
        <li>Each team must consist of exactly <strong>3-4 members</strong>.</li>
        <li>Only <strong>one device per team</strong> is allowed for accessing the game platform.</li>
        <li>Participants must report to the <strong>registration desk</strong> to get the <strong>Unique ID</strong> for their respective team.</li>
        <li>The event will be conducted <strong>within the campus boundaries only</strong>.</li>
        <li>All clues are hidden <strong>physically</strong>, but solving them will require using your device for input or to get the next clue.</li>
        <li><strong>Do not tamper with or remove clues</strong> after solving them.</li>
        <li>Some clues may involve <strong>puzzles, riddles, or trivia</strong>.</li>
        <li>A live <strong>Leaderboard</strong> will be displayed by the organizing team to maintain <strong>transparency</strong> during elimination.</li>
        <li><strong>No internet search</strong> or external help is allowed (unless specified).</li>
        <li><strong>No AIs</strong> are allowed during the specified interval.</li>
        <li><strong>Strictly no damaging property, asking/sharing clues, or cheating</strong>.</li>
        <li>Teams caught violating rules will be <strong>immediately disqualified</strong>.</li>
        <li>The organizing committee holds the authority to <strong>eliminate or reduce points</strong> for any team under special circumstances.</li>
        <li><strong>Hacking or tampering</strong> with the platform or clues is strictly prohibited.</li>
        <li>Participants must <strong>finish the rounds within the given time limits</strong>.</li>
        <li>In case of a tie, the team with the <strong>fastest time</strong> will be declared the winner.</li>
        <li>Some rounds may carry <strong>bonus points</strong>.</li>
        <li>Participants must <strong>remember their login credentials</strong> to avoid delays.</li>
        <li>Please <strong>respect other participants</strong> and the college premises at all times.</li>
      </ul>
    </div>
  );
};

export default Instructions;
